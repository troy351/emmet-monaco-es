import type * as Monaco from 'monaco-editor'

interface Token {
  readonly offset: number
  readonly type: string
  readonly language: string
}

function isValidEmmetToken(tokens: Token[], index: number, syntax: string, language: string): boolean {
  const currentTokenType = tokens[index].type

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
    // type must be `identifier` and not at start
    return (
      !!index &&
      ['identifier.js', 'type.identifier.js', 'identifier.ts', 'type.identifier.ts'].includes(currentTokenType)
    )
  }

  return false
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
  const { _tokenizationSupport, _tokenizationStateStore } = (model as any)._tokenization
  const state = _tokenizationStateStore.getBeginState(lineNumber - 1).clone()
  const tokenizationResult = _tokenizationSupport.tokenize(model.getLineContent(lineNumber), true, state, 0)
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
