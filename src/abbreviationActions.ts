import type * as Monaco from 'monaco-editor'

interface Token {
  readonly offset: number
  readonly type: string
  readonly language: string
}

function isValidEmmetToken(tokens: Token[], index: number, syntax: string, language: string): boolean {
  const currentToken = tokens[index]
  const currentTokenType = currentToken.type

  if (syntax === 'html') {
    // prevent emmet triggered within attributes
    return (
      (currentTokenType === '' && (index === 0 || tokens[index - 1].type === 'delimiter.html')) ||
      // #7 compatible with https://github.com/NeekSandhu/monaco-textmate
      tokens[0].type === 'text.html.basic'
    )
  }

  if (syntax === 'css') {
    if (currentTokenType === '') return true
    // less / scss allow nesting
    return currentTokenType === 'tag.' + language
  }

  if (syntax === 'jsx') {
    if (currentToken.language === 'mdx' && currentTokenType === '') {
      return true
    }

    // type must be `identifier` and not at start
    return (
      !!index &&
      ['identifier.js', 'type.identifier.js', 'identifier.ts', 'type.identifier.ts'].includes(currentTokenType)
    )
  }

  return false
}

const tokenEnvCache = new WeakMap<any, { _stateStore: any; _support: any }>()
function getTokenizationEnv(model: any) {
  if (tokenEnvCache.has(model)) return tokenEnvCache.get(model)!

  let _tokenization =
    // monaco-editor < 0.34.0
    model._tokenization ||
    // monaco-editor >= 0.35.0
    model.tokenization._tokenization

  // monaco-editor <= 0.34.0
  let _tokenizationStateStore = _tokenization?._tokenizationStateStore

  // monaco-editor >= 0.35.0
  if (!_tokenization || !_tokenizationStateStore) {
    const _t = model.tokenization

    const _tokens =
      // monaco-editor <= 0.51.0
      _t.grammarTokens ||
      // monaco-editor >= 0.52.0
      _t._tokens

    if (_tokens) {
      _tokenization = _tokens._defaultBackgroundTokenizer
      _tokenizationStateStore = _tokenization._tokenizerWithStateStore
    } else {
      // monaco-editor >= 0.35.0 && < 0.37.0, source code was minified
      Object.values(_t).some((val: any) => (_tokenization = val.tokenizeViewport && val))
      Object.values(_tokenization).some((val: any) => (_tokenizationStateStore = val.tokenizationSupport && val))
    }
  }

  const _tokenizationSupport =
    // monaco-editor >= 0.32.0
    _tokenizationStateStore.tokenizationSupport ||
    // monaco-editor <= 0.31.0
    _tokenization._tokenizationSupport

  const env = {
    _stateStore: _tokenizationStateStore,
    _support: _tokenizationSupport,
  }

  tokenEnvCache.set(model, env)
  return env
}

// vscode did a complex node analysis, we just use monaco's built-in tokenizer
// to achieve almost the same effect
export function isValidLocationForEmmetAbbreviation(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  syntax: string,
  language: string,
) {
  const { column, lineNumber } = position

  // get current line's tokens
  const { _stateStore, _support } = getTokenizationEnv(model)
  // monaco-editor < 0.37.0 uses `getBeginState` while monaco-editor >= 0.37.0 uses `getStartState`
  // note: lineNumber difference between two api
  const state = _stateStore.getBeginState?.(lineNumber - 1).clone() || _stateStore.getStartState(lineNumber).clone()
  const tokenizationResult = _support.tokenize(model.getLineContent(lineNumber), true, state, 0)
  const tokens: Token[] = tokenizationResult.tokens

  let valid = false

  // get token type at current column
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (column - 1 > tokens[i].offset) {
      valid = isValidEmmetToken(tokens, i, syntax, language)

      break
    }
  }

  return valid
}
