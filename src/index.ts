import type * as Monaco from 'monaco-editor'

import { doComplete, type VSCodeEmmetConfig } from './emmetHelper'
import { isValidLocationForEmmetAbbreviation } from './abbreviationActions'

declare global {
  interface Window {
    monaco?: typeof Monaco
  }
}

// https://github.com/microsoft/vscode/blob/main/extensions/emmet/src/util.ts#L86
const LANGUAGE_MODES: { [id: string]: string[] } = {
  html: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  jade: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  slim: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  haml: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  xml: ['.', '}', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  xsl: ['!', '.', '}', '*', '$', '/', ']', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  css: [':', '!', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  scss: [':', '!', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  sass: [':', '!', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  less: [':', '!', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  stylus: [':', '!', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  javascript: ['!', '.', '}', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  typescript: ['!', '.', '}', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
}

// https://github.com/microsoft/vscode/blob/main/extensions/emmet/src/util.ts#L124
const MAPPED_MODES: Record<string, string> = {
  handlebars: 'html',
  php: 'html',
  twig: 'html',
}

const DEFAULT_CONFIG: VSCodeEmmetConfig = {
  showExpandedAbbreviation: 'always',
  showAbbreviationSuggestions: true,
  showSuggestionsAsSnippets: false,
}

/**
 * add completion provider
 * @param monaco monaco self
 * @param language added language
 * @param isMarkup is markup language
 * @param isLegalToken check whether given token is legal or not
 * @param getLegalEmmetSets get legal emmet substring from a string.
 */
function registerProvider(monaco: typeof Monaco | undefined, languages: string[], syntax: string) {
  if (!monaco) {
    console.error("emmet-monaco-es: 'monaco' should be either declared on window or passed as first parameter")

    return
  }

  const providers = languages.map((language) =>
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: LANGUAGE_MODES[MAPPED_MODES[language] || language],
      provideCompletionItems: (model, position) =>
        isValidLocationForEmmetAbbreviation(model, position, syntax, language)
          ? doComplete(monaco!, model, position, syntax, DEFAULT_CONFIG)
          : undefined,
    }),
  )

  return () => {
    providers.forEach((provider) => provider.dispose())
  }
}

export function emmetHTML(monaco = window.monaco, languages: string[] = ['html']) {
  return registerProvider(monaco, languages, 'html')
}

export function emmetCSS(monaco = window.monaco, languages: string[] = ['css']) {
  return registerProvider(monaco, languages, 'css')
}

export function emmetJSX(monaco = window.monaco, languages: string[] = ['javascript']) {
  return registerProvider(monaco, languages, 'jsx')
}

export { expandAbbreviation, registerCustomSnippets } from './emmetHelper'
