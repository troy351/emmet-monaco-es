import { expand } from '@emmetio/expand-abbreviation'

const FIELD = '${0}'

/**
 * almost the same behavior as WebStorm's builtin emmet.
 * only triggered when string before text cursor(caret) matches emmet rules,
 * caret within html tag content area and suggest widget not visible,
 * otherwise will fallback to its original functionality.
 */
const emmetHTML = editor => {
  if (!editor) {
    throw Error('Must provide monaco-editor instance.')
  }

  const monaco = window.monaco
  if (!monaco) {
    throw Error('monaco-editor not loaded yet.')
  }

  let cursor
  // text needed to be emmeted
  let emmetText
  // emmet result
  let expandText

  // get legal emmet substring from a string
  // if whole string matches emmet rules, return it
  // if a substring(right to left) split by white space matches emmet rules,
  // return the substring
  // if nothing matches, return empty string
  const getLegalEmmet = str => {
    // empty or ends with white space, illegal
    if (str === '' || str.match(/\s$/)) return ''

    // deal with white space, this determines how many characters needed to be emmeted
    // e.g. `a span div` => `a span <div></div>` skip `a span `
    // e.g. `a{111 222}` => `<a href="">111 222</a>`
    // conclusion: white spaces are only allowed between `[]` or `{}`
    // note: quotes also allowed white spaces, but quotes must in `[]` or `{}`, so skip it
    const step = { '{': 1, '}': -1, '[': 1, ']': -1 }
    let pair = 0

    for (let i = str.length - 1; i > 0; i--) {
      pair += step[str[i]] || 0
      if (str[i].match(/\s/) && pair >= 0) {
        // illegal white space detected
        str = str.substr(i + 1)
        break
      }
    }

    // starts with illegal character
    // note: emmet self allowed number element like `<1></1>`,
    // but obviously it's not fit with html standard, so skip it
    if (!str.match(/^[a-zA-Z[(.#]/)) return ''

    // run expand to test the final result
    // `field` was used to set proper caret position after emmet
    try {
      expandText = expand(str, { field: () => FIELD })
    } catch (e) {
      return ''
    }

    return str
  }

  // register a context key to make sure emmet triggered at proper condition
  const emmetLegal = editor.createContextKey('emmetLegal', false)

  // using onDidChangeCursorSelection instead of onDidChangeCursorPosition,
  // that could skip checking when there is any selection
  editor.onDidChangeCursorSelection(cur => {
    const selection = cur.selection
    // if selection area not empty, return
    if (
      selection.startLineNumber !== selection.endLineNumber ||
      selection.startColumn !== selection.endColumn
    ) {
      return
    }

    /* do grammar analysis below */
    const model = editor.getModel()
    cursor = selection.getPosition()

    const column = cursor.column
    const lineNumber = cursor.lineNumber

    // there is nothing before caret, return
    if (
      column === 1 ||
      column <= model.getLineFirstNonWhitespaceColumn(lineNumber)
    ) {
      emmetLegal.set(false)
      return
    }

    // inspired by `monaco.editor.tokenize`.
    // see source map from `https://microsoft.github.io/monaco-editor/`
    const tokenizationSupport = model._tokens.tokenizationSupport
    let state = tokenizationSupport.getInitialState()
    let tokenizationResult

    for (let i = 1; i <= lineNumber; i++) {
      tokenizationResult = tokenizationSupport.tokenize(
        model.getLineContent(i),
        state,
        0,
      )
      state = tokenizationResult.endState
    }

    const tokens = tokenizationResult.tokens

    // get token type at current column
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (column - 1 > tokens[i].offset) {
        // type must be empty string when start emmet
        // and if not the first token, make sure the previous token is `delimiter.html`
        // to prevent emmet triggered within attributes
        if (
          tokens[i].type === '' &&
          (i === 0 || tokens[i - 1].type === 'delimiter.html')
        ) {
          // get content between current token offset and current cursor column
          emmetText = model
            .getLineContent(lineNumber)
            .substring(tokens[i].offset, column - 1)
            .trimLeft()
        } else {
          emmetLegal.set(false)
          return
        }
        break
      }
    }

    emmetText = getLegalEmmet(emmetText)
    emmetLegal.set(!!emmetText)
  })
  // add tab command with context
  editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      // attention: push an undo stop before and after executeEdits
      // to make sure undo operation works as expected
      editor.pushUndoStop()

      // record first `FIELD` position and remove all `FIELD`
      const expandTextArr = expandText.split(FIELD)
      const posOffsetArr = expandTextArr[0].split('\n')

      const lineNumber = cursor.lineNumber + posOffsetArr.length - 1
      const column =
        posOffsetArr.length === 1
          ? posOffsetArr[0].length - emmetText.length + cursor.column
          : posOffsetArr.slice(-1)[0].length + 1

      expandText = expandTextArr.join('')

      // replace range text with expandText
      editor.executeEdits('emmet', [
        {
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column - emmetText.length,
            cursor.lineNumber,
            cursor.column,
          ),
          text: expandText,
          forceMoveMarkers: true,
        },
      ])

      // move cursor to the position of first `FIELD` in expandText
      editor.setPosition(new monaco.Position(lineNumber, column))

      editor.pushUndoStop()
    },
    // do not trigger emmet when suggest widget visible(it's a builtin context key)
    'emmetLegal && !suggestWidgetVisible',
  )
}

export default emmetHTML
