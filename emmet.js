import { expand } from '@emmetio/expand-abbreviation';

const emmetHTML = editor => {
  if (!editor) {
    throw new Error('Must provide monaco-editor instance.');
  }

  const monaco = window.monaco;
  if (!monaco) {
    throw new Error('Monaco-editor not loaded yet.');
  }

  const model = editor.model;
  let cursor, emmetText, expandText;

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
    // but obviously its not fit html standard, so skip it
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

  editor.onDidChangeCursorPosition(cur => {
    // to ensure emmet triggered at the right time
    // we need to do grammar analysis

    cursor = cur.position;

    const column = cursor.column;
    // there is no character before column 1
    // no need to continue
    if (column === 1) {
      emmetLegal.set(false);
      return;
    }

    const lineNumber = cursor.lineNumber;

    // force line's state to be accurate
    model.getLineTokens(lineNumber, /* inaccurateTokensAcceptable */ false);
    // get the tokenization state at the beginning of this line
    const state = model._lines[lineNumber - 1].getState();
    // deal with state got null when paste
    if (!state) return;

    const freshState = state.clone();
    // get the human readable tokens on this line
    const token = model._tokenizationSupport.tokenize(
      model.getLineContent(lineNumber),
      freshState,
      0
    ).tokens;

    // get token type at current cursor position
    let i;
    for (i = token.length - 1; i >= 0; i--) {
      if (column - 1 > token[i].offset) {
        break;
      }
    }

    // type must be empty string when start emmet
    // and if not the first token, make sure the previous token is `delimiter.html`
    // to prevent emmet triggered within attributes
    if (
      token[i].type !== '' ||
      (i > 0 && token[i - 1].type !== 'delimiter.html')
    ) {
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
      editor.executeEdits('emmet', [
        {
          identifier: { major: 1, minor: 1 },
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column - emmetText.length,
            cursor.lineNumber,
            cursor.column
          ),
          text: expandText,
          forceMoveMarkers: true
        }
      ]);
    },
    'emmetLegal && !suggestWidgetVisible'
  );
};

export default emmetHTML;
