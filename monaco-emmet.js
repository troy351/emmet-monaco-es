import { expandAbbreviation as expand } from './emmet';

const emmetHTML = editor => {
  if (!editor) {
    throw new Error('Must provide monaco-editor instance.');
  }

  const monaco = window.monaco;
  if (!monaco) {
    throw new Error('monaco-editor not loaded yet.');
  }

  let cursor;
  let emmetText;
  let expandText;

  // get a legal emmet from a string
  // if whole string matches emmet rules, return it
  // if a substring(right to left) split by white space matches emmet rules, return the substring
  // if nothing matches, return empty string
  const getLegalEmmet = str => {
    // empty or ends with white space, illegal
    if (str === '' || str.match(/\s$/)) return '';

    // deal with white space, this determines how many characters needed to be emmeted
    // e.g. `a span div` => `a span <div></div>` skip `a span `
    // e.g. `a{111 222}` => `<a href="">111 222</a>`
    // conclusion: white spaces are only allowed between `[]` or `{}`
    // note: quotes also allowed white spaces, but quotes must in `[]` or `{}`, so ignore it
    const step = { '{': 1, '}': -1, '[': 1, ']': -1 };
    let pair = 0;

    for (let i = str.length - 1; i > 0; i--) {
      pair += step[str[i]] || 0;
      if (str[i].match(/\s/) && pair >= 0) {
        // illegal white space detected
        str = str.substr(i + 1);
        break;
      }
    }

    // starts with illegal character
    // note: emmet self allowed number element like `<1></1>`,
    // but obviously its not fit with html standard, so skip it
    if (!str.match(/^[a-zA-Z[(.#]/)) {
      return '';
    }

    // finally run expand to test the final result
    try {
      expandText = expand(str);
    } catch (e) {
      return '';
    }

    return str;
  };

  // register a context key to make sure emmet triggered at proper condition
  const emmetLegal = editor.createContextKey('emmetLegal', false);

  // using onDidChangeCursorSelection instead of onDidChangeCursorPosition,
  // that could skip checking when there is any selection
  editor.onDidChangeCursorSelection(cur => {
    const selection = cur.selection;
    // if selection area not empty, return
    if (
      selection.startLineNumber !== selection.endLineNumber ||
      selection.startColumn !== selection.endColumn
    ) {
      return;
    }

    // to ensure emmet triggered at the proper time
    // grammar analysis is needed
    const model = editor.model;
    cursor = selection.getPosition();

    const column = cursor.column;
    const lineNumber = cursor.lineNumber;

    // cursor at empty area, no need to continue
    if (column <= model.getLineFirstNonWhitespaceColumn(lineNumber)) {
      emmetLegal.set(false);
      return;
    }

    // get human readable current line tokens
    // inspire from /vs/editor/standalone/browser/inspectTokens/inspectTokens.ts
    // private _getTokensAtLine && private _getStateBeforeLine

    // eslint-disable-next-line no-underscore-dangle
    const tokenizationSupport = model._tokens.tokenizationSupport;
    let state = tokenizationSupport.getInitialState();
    for (let i = 1; i < lineNumber; i++) {
      const tokenizationResult = tokenizationSupport.tokenize(model.getLineContent(i), state, 0);
      state = tokenizationResult.endState;
    }
    const token = tokenizationSupport.tokenize(model.getLineContent(lineNumber), state, 0).tokens;

    // get token type at current column
    let i;
    for (i = token.length - 1; i >= 0; i--) {
      if (column - 1 > token[i].offset) {
        break;
      }
    }

    // type must be empty string when start emmet
    // and if not the first token, make sure the previous token is `delimiter.html`
    // to prevent emmet triggered within attributes
    if (token[i].type !== '' || (i > 0 && token[i - 1].type !== 'delimiter.html')) {
      emmetLegal.set(false);
      return;
    }

    // get content starts from current token offset to current cursor column
    emmetText = model
      .getLineContent(lineNumber)
      .substring(token[i].offset, column - 1)
      .trimLeft();

    emmetText = getLegalEmmet(emmetText);
    emmetLegal.set(!!emmetText);
  });

  // add tab command with context
  editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      // attention: push an undo stop before and after executeEdits
      // to make sure the undo operation is as expected
      editor.pushUndoStop();

      // record first `${0}` position and remove all `${0}`
      // eslint-disable-next-line no-template-curly-in-string
      const posOffsetArr = expandText.split('${0}')[0].split('\n');

      const lineNumber = cursor.lineNumber + posOffsetArr.length - 1;
      const column =
        posOffsetArr.length === 1
          ? posOffsetArr[0].length - emmetText.length + cursor.column
          : posOffsetArr.slice(-1)[0].length + 1;
      expandText = expandText.replace(/\$\{0\}/g, '');

      // replace range text with expandText
      editor.executeEdits('emmet', [
        {
          identifier: { major: 1, minor: 1 },
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column - emmetText.length,
            cursor.lineNumber,
            cursor.column,
          ),
          text: expandText,
          forceMoveMarkers: true,
        },
      ]);

      // move cursor to the position of first `${0}` in expandText
      editor.setPosition(new monaco.Position(lineNumber, column));

      editor.pushUndoStop();
    },
    'emmetLegal && !suggestWidgetVisible',
  );
};

export default emmetHTML;
