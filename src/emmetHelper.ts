/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import expand, {
  type Config,
  extract,
  type ExtractOptions,
  type MarkupAbbreviation,
  type Options,
  resolveConfig,
  stringifyMarkup,
  stringifyStylesheet,
  type StylesheetAbbreviation,
  type SyntaxType,
  type UserConfig,
} from 'emmet'

import { cssData, htmlData } from './data'

import type * as Monaco from 'monaco-editor'

// /* workaround for webpack issue: https://github.com/webpack/webpack/issues/5756
//  @emmetio/extract-abbreviation has a cjs that uses a default export
// */
// const extract = typeof _extractAbbreviation === 'function' ? _extractAbbreviation : _extractAbbreviation.default;

type TextModel = Monaco.editor.ITextModel
type CompletionList = Monaco.languages.CompletionList
type CompletionItem = Monaco.languages.CompletionItem
type Position = Monaco.IPosition
type Range = Monaco.IRange

export interface SnippetsMap {
  [name: string]: string
}

const snippetKeyCache = new Map<string, string[]>()
let markupSnippetKeys: string[]
const stylesheetCustomSnippetsKeyCache = new Map<string, string[]>()
const htmlAbbreviationStartRegex = /^[a-z,A-Z,!,(,[,#,\.\{]/
// take off { for jsx because it interferes with the language
const jsxAbbreviationStartRegex = /^[a-z,A-Z,!,(,[,#,\.]/
const cssAbbreviationRegex = /^-?[a-z,A-Z,!,@,#]/
const htmlAbbreviationRegex = /[a-z,A-Z\.]/
const commonlyUsedTags = [...htmlData.tags, 'lorem']
const bemFilterSuffix = 'bem'
const filterDelimitor = '|'
const trimFilterSuffix = 't'
const commentFilterSuffix = 'c'
const maxFilters = 3

/**
 * Emmet configuration as derived from the Emmet related VS Code settings
 */
export interface VSCodeEmmetConfig {
  showExpandedAbbreviation?: string
  showAbbreviationSuggestions?: boolean
  syntaxProfiles?: object
  variables?: object
  preferences?: object
  excludeLanguages?: string[]
  showSuggestionsAsSnippets?: boolean
}

/**
 * Returns all applicable emmet expansions for abbreviation at given position in a CompletionList
 * @param model TextModel in which completions are requested
 * @param position Position in the document at which completions are requested
 * @param syntax Emmet supported language
 * @param emmetConfig Emmet Configurations as derived from VS Code
 */
export function doComplete(
  monaco: typeof Monaco,
  model: TextModel,
  position: Position,
  syntax: string,
  emmetConfig: VSCodeEmmetConfig,
): CompletionList | undefined {
  const isStyleSheetRes = isStyleSheet(syntax)

  // Fetch markupSnippets so that we can provide possible abbreviation completions
  // For example, when text at position is `a`, completions should return `a:blank`, `a:link`, `acr` etc.
  if (!isStyleSheetRes) {
    if (!snippetKeyCache.has(syntax)) {
      const registry: SnippetsMap = {
        ...getDefaultSnippets(syntax),
        ...customSnippetsRegistry[syntax],
      }
      snippetKeyCache.set(syntax, Object.keys(registry))
    }
    markupSnippetKeys = snippetKeyCache.get(syntax) ?? []
  }

  const extractOptions: Partial<ExtractOptions> = {
    lookAhead: !isStyleSheetRes,
    type: getSyntaxType(syntax),
  }
  const extractedValue = extractAbbreviation(monaco, model, position, extractOptions)
  if (!extractedValue) return

  const { abbreviationRange, abbreviation, currentLineTillPosition, filter } = extractedValue

  const currentWord = getCurrentWord(currentLineTillPosition)
  // Don't attempt to expand open tags
  if (currentWord === abbreviation && currentLineTillPosition.endsWith(`<${abbreviation}`) && !isStyleSheetRes) {
    return
  }

  const expandOptions = getExpandOptions(syntax, filter)

  let expandedText = ''
  let expandedAbbr: CompletionItem | undefined
  let completionItems: CompletionItem[] = []

  // Create completion item after expanding given abbreviation
  // if abbreviation is valid and expanded value is not noise
  const createExpandedAbbr = (syntax: string, abbr: string) => {
    if (!isAbbreviationValid(syntax, abbreviation)) return

    try {
      expandedText = expand(abbr, expandOptions)

      // manually patch https://github.com/microsoft/vscode/issues/120245 for now
      if (isStyleSheetRes && '!important'.startsWith(abbr)) {
        expandedText = '!important'
      }
    } catch (e) {}

    if (!expandedText || isExpandedTextNoise(syntax, abbr, expandedText, expandOptions.options)) {
      return
    }

    expandedAbbr = {
      kind: monaco.languages.CompletionItemKind.Property,
      label: abbreviation + (filter ? '|' + filter.replace(',', '|') : ''),
      documentation: replaceTabStopsWithCursors(expandedText),
      detail: 'Emmet abbreviation',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: abbreviationRange,
      insertText: escapeNonTabStopDollar(addFinalTabStop(expandedText)),
    }

    completionItems = [expandedAbbr]
  }

  createExpandedAbbr(syntax, abbreviation)

  if (isStyleSheetRes) {
    // When abbr is longer than usual emmet snippets and matches better with existing css property, then no emmet
    if (abbreviation.length > 4 && cssData.properties.some((x) => x.startsWith(abbreviation))) {
      return { suggestions: [], incomplete: true }
    }

    if (expandedAbbr && expandedText.length) {
      expandedAbbr.range = abbreviationRange
      expandedAbbr.insertText = escapeNonTabStopDollar(addFinalTabStop(expandedText))
      expandedAbbr.documentation = replaceTabStopsWithCursors(expandedText)
      expandedAbbr.label = removeTabStops(expandedText)
      expandedAbbr.filterText = abbreviation

      // Custom snippets should show up in completions if abbreviation is a prefix
      const stylesheetCustomSnippetsKeys = stylesheetCustomSnippetsKeyCache.has(syntax)
        ? stylesheetCustomSnippetsKeyCache.get(syntax)
        : stylesheetCustomSnippetsKeyCache.get('css')
      completionItems = makeSnippetSuggestion(
        monaco,
        stylesheetCustomSnippetsKeys ?? [],
        abbreviation,
        abbreviation,
        abbreviationRange,
        expandOptions,
        'Emmet Custom Snippet',
        false,
      )

      if (!completionItems.find((x) => x.insertText === expandedAbbr?.insertText)) {
        // Fix for https://github.com/Microsoft/vscode/issues/28933#issuecomment-309236902
        // When user types in propertyname, emmet uses it to match with snippet names, resulting in width -> widows or font-family -> font: family
        // Filter out those cases here.
        const abbrRegex = new RegExp(
          '.*' +
            abbreviation
              .split('')
              .map((x) => (x === '$' || x === '+' ? '\\' + x : x))
              .join('.*') +
            '.*',
          'i',
        )
        if (/\d/.test(abbreviation) || abbrRegex.test(expandedAbbr.label)) {
          completionItems.push(expandedAbbr)
        }
      }
    }
  } else {
    let tagToFindMoreSuggestionsFor = abbreviation
    const newTagMatches = abbreviation.match(/(>|\+)([\w:-]+)$/)
    if (newTagMatches && newTagMatches.length === 3) {
      tagToFindMoreSuggestionsFor = newTagMatches[2]
    }

    if (syntax !== 'xml') {
      const commonlyUsedTagSuggestions = makeSnippetSuggestion(
        monaco,
        commonlyUsedTags,
        tagToFindMoreSuggestionsFor,
        abbreviation,
        abbreviationRange,
        expandOptions,
        'Emmet Abbreviation',
      )
      completionItems = completionItems.concat(commonlyUsedTagSuggestions)
    }

    if (emmetConfig.showAbbreviationSuggestions === true) {
      const abbreviationSuggestions = makeSnippetSuggestion(
        monaco,
        markupSnippetKeys.filter((x) => !commonlyUsedTags.includes(x)),
        tagToFindMoreSuggestionsFor,
        abbreviation,
        abbreviationRange,
        expandOptions,
        'Emmet Abbreviation',
      )

      // Workaround for the main expanded abbr not appearing before the snippet suggestions
      if (expandedAbbr && abbreviationSuggestions.length > 0 && tagToFindMoreSuggestionsFor !== abbreviation) {
        expandedAbbr.sortText = '0' + expandedAbbr.label
        abbreviationSuggestions.forEach((item) => {
          // Workaround for snippet suggestions items getting filtered out as the complete abbr does not start with snippetKey
          item.filterText = abbreviation
          // Workaround for the main expanded abbr not appearing before the snippet suggestions
          item.sortText = '9' + abbreviation
        })
      }
      completionItems = completionItems.concat(abbreviationSuggestions)
    }

    // https://github.com/microsoft/vscode/issues/66680
    if (
      syntax === 'html' &&
      completionItems.length >= 2 &&
      abbreviation.includes(':') &&
      expandedAbbr?.insertText === `<${abbreviation}>\${0}</${abbreviation}>`
    ) {
      completionItems = completionItems.filter((item) => item.label !== abbreviation)
    }
  }

  if (emmetConfig.showSuggestionsAsSnippets === true) {
    completionItems.forEach((x) => (x.kind = monaco.languages.CompletionItemKind.Snippet))
  }
  return completionItems.length ? { suggestions: completionItems, incomplete: true } : undefined
}

/**
 * Create & return snippets for snippet keys that start with given prefix
 */
function makeSnippetSuggestion(
  monaco: typeof Monaco,
  snippetKeys: string[],
  prefix: string,
  abbreviation: string,
  abbreviationRange: Range,
  expandOptions: UserConfig,
  snippetDetail: string,
  skipFullMatch: boolean = true,
): CompletionItem[] {
  if (!prefix || !snippetKeys) {
    return []
  }
  const snippetCompletions: CompletionItem[] = []
  snippetKeys.forEach((snippetKey) => {
    if (!snippetKey.startsWith(prefix.toLowerCase()) || (skipFullMatch && snippetKey === prefix.toLowerCase())) {
      return
    }

    const currentAbbr = abbreviation + snippetKey.substr(prefix.length)
    let expandedAbbr
    try {
      expandedAbbr = expand(currentAbbr, expandOptions)
    } catch (e) {}
    if (!expandedAbbr) {
      return
    }

    const item: CompletionItem = {
      kind: monaco.languages.CompletionItemKind.Property,
      label: prefix + snippetKey.substr(prefix.length),
      documentation: replaceTabStopsWithCursors(expandedAbbr),
      detail: snippetDetail,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: abbreviationRange,
      insertText: escapeNonTabStopDollar(addFinalTabStop(expandedAbbr)),
    }

    snippetCompletions.push(item)
  })
  return snippetCompletions
}

function getCurrentWord(currentLineTillPosition: string): string | undefined {
  if (currentLineTillPosition) {
    const matches = currentLineTillPosition.match(/[\w,:,-,\.]*$/)
    if (matches) {
      return matches[0]
    }
  }
}

function replaceTabStopsWithCursors(expandedWord: string): string {
  return expandedWord.replace(/([^\\])\$\{\d+\}/g, '$1|').replace(/\$\{\d+:([^\}]+)\}/g, '$1')
}

function removeTabStops(expandedWord: string): string {
  return expandedWord.replace(/([^\\])\$\{\d+\}/g, '$1').replace(/\$\{\d+:([^\}]+)\}/g, '$1')
}

function escapeNonTabStopDollar(text: string): string {
  return text ? text.replace(/([^\\])(\$)([^\{])/g, '$1\\$2$3') : text
}

function addFinalTabStop(text: string): string {
  if (!text || !text.trim()) {
    return text
  }

  let maxTabStop = -1
  type TabStopRange = { numberStart: number; numberEnd: number }
  let maxTabStopRanges: TabStopRange[] = []
  let foundLastStop = false
  let replaceWithLastStop = false
  let i = 0
  const n = text.length

  try {
    while (i < n && !foundLastStop) {
      // Look for ${
      if (text[i++] != '$' || text[i++] != '{') {
        continue
      }

      // Find tabstop
      let numberStart = -1
      let numberEnd = -1
      while (i < n && /\d/.test(text[i])) {
        numberStart = numberStart < 0 ? i : numberStart
        numberEnd = i + 1
        i++
      }

      // If ${ was not followed by a number and either } or :, then its not a tabstop
      if (numberStart === -1 || numberEnd === -1 || i >= n || (text[i] != '}' && text[i] != ':')) {
        continue
      }

      // If ${0} was found, then break
      const currentTabStop = text.substring(numberStart, numberEnd)
      foundLastStop = currentTabStop === '0'
      if (foundLastStop) {
        break
      }

      let foundPlaceholder = false
      if (text[i++] == ':') {
        // TODO: Nested placeholders may break here
        while (i < n) {
          if (text[i] == '}') {
            foundPlaceholder = true
            break
          }
          i++
        }
      }

      // Decide to replace currentTabStop with ${0} only if its the max among all tabstops and is not a placeholder
      if (Number(currentTabStop) > Number(maxTabStop)) {
        maxTabStop = Number(currentTabStop)
        maxTabStopRanges = [{ numberStart, numberEnd }]
        replaceWithLastStop = !foundPlaceholder
      } else if (Number(currentTabStop) === maxTabStop) {
        maxTabStopRanges.push({ numberStart, numberEnd })
      }
    }
  } catch (e) {}

  if (replaceWithLastStop && !foundLastStop) {
    for (let i = 0; i < maxTabStopRanges.length; i++) {
      const rangeStart = maxTabStopRanges[i].numberStart
      const rangeEnd = maxTabStopRanges[i].numberEnd
      text = text.substr(0, rangeStart) + '0' + text.substr(rangeEnd)
    }
  }

  return text
}

let customSnippetsRegistry: Record<string, SnippetsMap> = {}

const emmetSnippetField = (index: number, placeholder: string) => `\${${index}${placeholder ? ':' + placeholder : ''}}`

/** Returns whether or not syntax is a supported stylesheet syntax, like CSS */
function isStyleSheet(syntax: string): boolean {
  return syntax === 'css'
}

/** Returns the syntax type, either markup (e.g. for HTML) or stylesheet (e.g. for CSS) */
function getSyntaxType(syntax: string): SyntaxType {
  return isStyleSheet(syntax) ? 'stylesheet' : 'markup'
}

/** Returns the default syntax (html or css) to use for the snippets registry */
export function getDefaultSyntax(syntax: string): string {
  return isStyleSheet(syntax) ? 'css' : 'html'
}

/** Returns the default snippets that Emmet suggests */
function getDefaultSnippets(syntax: string): SnippetsMap {
  const syntaxType = getSyntaxType(syntax)
  const emptyUserConfig: UserConfig = { type: syntaxType, syntax }
  const resolvedConfig: Config = resolveConfig(emptyUserConfig)

  // https://github.com/microsoft/vscode/issues/97632
  // don't return markup (HTML) snippets for XML
  return syntax === 'xml' ? {} : resolvedConfig.snippets
}

function getFilters(text: string, pos: number): { pos: number; filter: string | undefined } {
  let filter: string | undefined
  for (let i = 0; i < maxFilters; i++) {
    if (text.endsWith(`${filterDelimitor}${bemFilterSuffix}`, pos)) {
      pos -= bemFilterSuffix.length + 1
      filter = filter ? bemFilterSuffix + ',' + filter : bemFilterSuffix
    } else if (text.endsWith(`${filterDelimitor}${commentFilterSuffix}`, pos)) {
      pos -= commentFilterSuffix.length + 1
      filter = filter ? commentFilterSuffix + ',' + filter : commentFilterSuffix
    } else if (text.endsWith(`${filterDelimitor}${trimFilterSuffix}`, pos)) {
      pos -= trimFilterSuffix.length + 1
      filter = filter ? trimFilterSuffix + ',' + filter : trimFilterSuffix
    } else {
      break
    }
  }

  return {
    pos: pos,
    filter: filter,
  }
}

/**
 * Extracts abbreviation from the given position in the given document
 * @param model The TextModel from which abbreviation needs to be extracted
 * @param position The Position in the given document from where abbreviation needs to be extracted
 * @param options The options to pass to the @emmetio/extract-abbreviation module
 */
function extractAbbreviation(
  monaco: typeof Monaco,
  model: TextModel,
  position: Position,
  options?: Partial<ExtractOptions>,
):
  | {
      abbreviation: string
      abbreviationRange: Range
      currentLineTillPosition: string
      filter: string | undefined
    }
  | undefined {
  const currentLine = model.getLineContent(position.lineNumber)
  const currentLineTillPosition = currentLine.substr(0, position.column - 1)

  const { pos, filter } = getFilters(currentLineTillPosition, position.column - 1)
  const lengthOccupiedByFilter = filter ? filter.length + 1 : 0
  const result = extract(currentLine, pos, options)
  if (!result) return

  const rangeToReplace = new monaco.Range(
    position.lineNumber,
    result.location + 1,
    position.lineNumber,
    result.location + result.abbreviation.length + lengthOccupiedByFilter + 1,
  )

  return {
    abbreviationRange: rangeToReplace,
    abbreviation: result.abbreviation,
    currentLineTillPosition,
    filter,
  }
}

/**
 * Returns a boolean denoting validity of given abbreviation in the context of given syntax
 * Not needed once https://github.com/emmetio/atom-plugin/issues/22 is fixed
 * @param syntax string
 * @param abbreviation string
 */
function isAbbreviationValid(syntax: string, abbreviation: string): boolean {
  if (!abbreviation) {
    return false
  }
  if (isStyleSheet(syntax)) {
    if (abbreviation.includes('#')) {
      if (abbreviation.startsWith('#')) {
        const hexColorRegex = /^#[\d,a-f,A-F]{1,6}$/
        return hexColorRegex.test(abbreviation)
      } else if (commonlyUsedTags.includes(abbreviation.substring(0, abbreviation.indexOf('#')))) {
        return false
      }
    }
    return cssAbbreviationRegex.test(abbreviation)
  }
  if (abbreviation.startsWith('!')) {
    return !/[^!]/.test(abbreviation)
  }

  // Its common for users to type (sometextinsidebrackets), this should not be treated as an abbreviation
  // Grouping in abbreviation is valid only if it's inside a text node or preceeded/succeeded with one of the symbols for nesting, sibling, repeater or climb up
  // Also, cases such as `span[onclick="alert();"]` are valid
  if (
    (/\(/.test(abbreviation) || /\)/.test(abbreviation)) &&
    !/\{[^\}\{]*[\(\)]+[^\}\{]*\}(?:[>\+\*\^]|$)/.test(abbreviation) &&
    !/\(.*\)[>\+\*\^]/.test(abbreviation) &&
    !/\[[^\[\]\(\)]+=".*"\]/.test(abbreviation) &&
    !/[>\+\*\^]\(.*\)/.test(abbreviation)
  ) {
    return false
  }

  if (syntax === 'jsx') {
    return jsxAbbreviationStartRegex.test(abbreviation) && htmlAbbreviationRegex.test(abbreviation)
  }
  return htmlAbbreviationStartRegex.test(abbreviation) && htmlAbbreviationRegex.test(abbreviation)
}

function isExpandedTextNoise(
  syntax: string,
  abbreviation: string,
  expandedText: string,
  options: Partial<Options> | undefined,
): boolean {
  // Unresolved css abbreviations get expanded to a blank property value
  // Eg: abc -> abc: ; or abc:d -> abc: d; which is noise if it gets suggested for every word typed
  if (isStyleSheet(syntax) && options) {
    const between = options['stylesheet.between'] ?? ': '
    const after = options['stylesheet.after'] ?? ';'

    // Remove overlapping between `abbreviation` and `between`, if any
    let endPrefixIndex = abbreviation.indexOf(between[0], Math.max(abbreviation.length - between.length, 0))
    endPrefixIndex = endPrefixIndex >= 0 ? endPrefixIndex : abbreviation.length
    const abbr = abbreviation.substring(0, endPrefixIndex)

    return (
      expandedText === `${abbr}${between}\${0}${after}` ||
      expandedText.replace(/\s/g, '') === abbreviation.replace(/\s/g, '') + after
    )
  }

  // we don't want common html tags suggested for xml
  if (syntax === 'xml' && commonlyUsedTags.some((tag) => tag.startsWith(abbreviation.toLowerCase()))) {
    return true
  }

  if (commonlyUsedTags.includes(abbreviation.toLowerCase()) || markupSnippetKeys.includes(abbreviation)) {
    return false
  }

  // Custom tags can have - or :
  if (/[-,:]/.test(abbreviation) && !/--|::/.test(abbreviation) && !abbreviation.endsWith(':')) {
    return false
  }

  // Its common for users to type some text and end it with period, this should not be treated as an abbreviation
  // Else it becomes noise.

  // When user just types '.', return the expansion
  // Otherwise emmet loses change to participate later
  // For example in `.foo`. See https://github.com/Microsoft/vscode/issues/66013
  if (abbreviation === '.') {
    return false
  }

  const dotMatches = abbreviation.match(/^([a-z,A-Z,\d]*)\.$/)
  if (dotMatches) {
    // Valid html tags such as `div.`
    if (dotMatches[1] && htmlData.tags.includes(dotMatches[1])) {
      return false
    }
    return true
  }

  // Fix for https://github.com/microsoft/vscode/issues/89746
  // PascalCase tags are common in jsx code, which should not be treated as noise.
  // Eg: MyAwesomComponent -> <MyAwesomComponent></MyAwesomComponent>
  if (syntax === 'jsx' && /^([A-Z][A-Za-z0-9]*)+$/.test(abbreviation)) {
    return false
  }

  // Unresolved html abbreviations get expanded as if it were a tag
  // Eg: abc -> <abc></abc> which is noise if it gets suggested for every word typed
  return expandedText.toLowerCase() === `<${abbreviation.toLowerCase()}>\${1}</${abbreviation.toLowerCase()}>`
}

type ExpandOptionsConfig = {
  type: SyntaxType
  options: Partial<Options>
  variables: SnippetsMap
  snippets: SnippetsMap
  syntax: string
  text: string | string[] | undefined
  maxRepeat: number
}

/**
 * Returns options to be used by emmet
 */
function getExpandOptions(syntax: string, filter?: string): ExpandOptionsConfig {
  const filters = filter ? filter.split(',').map((x) => x.trim()) : []
  const bemEnabled = filters.includes('bem')
  const commentEnabled = filters.includes('c')

  const combinedOptions: Partial<Options> = {
    'output.formatSkip': ['html'],
    'output.formatForce': ['body'],
    'output.field': emmetSnippetField,
    'output.inlineBreak': 0,
    'output.compactBoolean': false,
    'output.reverseAttributes': false,
    'markup.href': true,
    'comment.enabled': commentEnabled,
    'comment.trigger': ['id', 'class'],
    'comment.before': '',
    'comment.after': '\n<!-- /[#ID][.CLASS] -->',
    'bem.enabled': bemEnabled,
    'bem.element': '__',
    'bem.modifier': '_',
    'jsx.enabled': syntax === 'jsx',
    'stylesheet.shortHex': true,
    'stylesheet.between': syntax === 'stylus' ? ' ' : ': ',
    'stylesheet.after': syntax === 'sass' || syntax === 'stylus' ? '' : ';',
    'stylesheet.intUnit': 'px',
    'stylesheet.floatUnit': 'em',
    'stylesheet.unitAliases': {
      e: 'em',
      p: '%',
      x: 'ex',
      r: 'rem',
    },
    'stylesheet.fuzzySearchMinScore': 0.3,
    'output.format': true,
    'output.selfClosingStyle': 'html',
  }

  const type = getSyntaxType(syntax)
  const baseSyntax = getDefaultSyntax(syntax)
  const snippets =
    type === 'stylesheet'
      ? customSnippetsRegistry[syntax] ?? customSnippetsRegistry[baseSyntax]
      : customSnippetsRegistry[syntax]

  return {
    type,
    options: combinedOptions,
    variables: {},
    snippets,
    syntax,
    // context: null,
    text: undefined,
    maxRepeat: 1000,
    // cache: null
  }
}

/**
 * Assigns snippets from one snippet file under emmet.extensionsPath to
 * customSnippetsRegistry, snippetKeyCache, and stylesheetCustomSnippetsKeyCache
 */
export function registerCustomSnippets(syntax: string, customSnippets: SnippetsMap) {
  const baseSyntax = getDefaultSyntax(syntax)

  if (baseSyntax !== syntax && customSnippetsRegistry[baseSyntax]) {
    customSnippets = Object.assign({}, customSnippetsRegistry[baseSyntax], customSnippets)
  }

  if (isStyleSheet(syntax)) {
    const prevSnippetKeys = stylesheetCustomSnippetsKeyCache.get(syntax)
    const mergedSnippetKeys = Object.assign([], prevSnippetKeys, Object.keys(customSnippets))
    stylesheetCustomSnippetsKeyCache.set(syntax, mergedSnippetKeys)
  }

  const prevSnippetsRegistry = customSnippetsRegistry[syntax]
  const mergedSnippets = Object.assign({}, prevSnippetsRegistry, customSnippets)
  customSnippetsRegistry[syntax] = mergedSnippets
}

/**
 * Expands given abbreviation using given options
 * @param abbreviation string or parsed abbreviation
 * @param config options used by the @emmetio/expand-abbreviation module to expand given abbreviation
 */
export function expandAbbreviation(
  abbreviation: string | MarkupAbbreviation | StylesheetAbbreviation,
  config: UserConfig,
): string {
  let expandedText
  const resolvedConfig = resolveConfig(config)
  if (config.type === 'stylesheet') {
    if (typeof abbreviation === 'string') {
      expandedText = expand(abbreviation, resolvedConfig)
    } else {
      expandedText = stringifyStylesheet(abbreviation as StylesheetAbbreviation, resolvedConfig)
    }
  } else {
    if (typeof abbreviation === 'string') {
      expandedText = expand(abbreviation, resolvedConfig)
    } else {
      expandedText = stringifyMarkup(abbreviation as MarkupAbbreviation, resolvedConfig)
    }
  }
  return escapeNonTabStopDollar(addFinalTabStop(expandedText))
}
