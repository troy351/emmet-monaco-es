import * as Monaco from "monaco-editor";

declare global {
  interface Window {
    monaco?: typeof Monaco;
  }
}

export type MonacoEditor = Monaco.editor.IStandaloneCodeEditor;

export const CONTEXT_KEY_LEGAL = "emmetLegal";
export const CONTEXT_KEY_ENABLED = "emmetEnabled";

export const FIELD = "${}";
export const defaultOption = { field: () => FIELD };

export function checkMonacoExists(
  monaco?: typeof Monaco
): monaco is typeof Monaco {
  if (!monaco)
    console.error(
      "monaco-emmet-es: 'monaco' should be either declared on window or passed as second parameter"
    );

  return !!monaco;
}

export function checkDuplicatedEnable(contextKeys: EmmetContextKeys) {
  const isDuplicated = !contextKeys.isNew && contextKeys.enabled.get();

  if (isDuplicated)
    console.error(
      "monaco-emmet-es: 'monaco' should be either declared on window or passed as second parameter"
    );

  return isDuplicated;
}

type EmmetContextKey = Monaco.editor.IContextKey<boolean>;
interface EmmetContextKeys {
  legal: EmmetContextKey;
  enabled: EmmetContextKey;
  /**
   * new created or load from map
   */
  isNew: boolean;
}

// store context key for each editor, for usage of rebind
const contextKeyMap = new WeakMap<MonacoEditor, EmmetContextKeys>();

export function getContextKey(editor: MonacoEditor): EmmetContextKeys {
  let keys = contextKeyMap.get(editor);
  if (keys) {
    keys.isNew = false;
    return keys;
  }

  keys = {
    legal: editor.createContextKey(CONTEXT_KEY_LEGAL, false),
    enabled: editor.createContextKey(CONTEXT_KEY_ENABLED, true),
    isNew: true
  };

  contextKeyMap.set(editor, keys);
  return keys;
}

export interface EditorStatus {
  lineNumber: number;
  column: number;
  /**
   * text needed to be emmeted
   */
  emmetText: string;
  /**
   * emmet result
   */
  expandText: string;
}

interface Token {
  readonly offset: number;
  readonly type: string;
  readonly language: string;
}

/**
 * caret change event
 * @param editor editor instance
 * @param legalKey check legal context key
 * @param isLegalToken check if given token legal
 * @param getLegalSubstr get legal emmet substring from a string.
 * if whole string matches emmet rules, return it.
 * if a substring(right to left) split by white space matches emmet rules, return the substring.
 * if nothing matches, return empty string
 * @param onChange result callback
 */
export function caretChange(
  editor: MonacoEditor,
  legalKey: Monaco.editor.IContextKey<boolean>,
  isLegalToken: (tokens: Token[], index: number) => boolean,
  getLegalSubstr: (emmetText: string) => string,
  onChange: (
    status: Pick<EditorStatus, Exclude<keyof EditorStatus, "expandText">>
  ) => void
) {
  // using onDidChangeCursorSelection instead of onDidChangeCursorPosition,
  // that could skip checking when there is any selection
  return editor.onDidChangeCursorSelection(cur => {
    const selection = cur.selection;
    // if selection area not empty, return
    if (
      selection.startLineNumber !== selection.endLineNumber ||
      selection.startColumn !== selection.endColumn
    ) {
      return;
    }

    /* do grammar analysis below */
    const model = editor.getModel();
    if (!model) return;

    const { column, lineNumber } = selection.getPosition();

    // there is nothing before caret, return
    if (
      column === 1 ||
      column <= model.getLineFirstNonWhitespaceColumn(lineNumber)
    ) {
      legalKey.set(false);
      return;
    }

    // inspired by `monaco.editor.tokenize`.
    // see source map from `https://microsoft.github.io/monaco-editor/`
    const tokenizationSupport = (model as any)._tokens.tokenizationSupport;
    let state = tokenizationSupport.getInitialState();
    let tokenizationResult;

    for (let i = 1; i <= lineNumber; i++) {
      tokenizationResult = tokenizationSupport.tokenize(
        model.getLineContent(i),
        state,
        0
      );
      state = tokenizationResult.endState;
    }

    const tokens: Token[] = tokenizationResult.tokens;

    // get token type at current column
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (column - 1 > tokens[i].offset) {
        // type must be empty string when start emmet
        // and if not the first token, make sure the previous token is `delimiter.html`
        // to prevent emmet triggered within attributes
        if (isLegalToken(tokens, i)) {
          // get content between current token offset and current cursor column
          const emmetText = getLegalSubstr(
            model
              .getLineContent(lineNumber)
              .substring(tokens[i].offset, column - 1)
          );
          legalKey.set(!!emmetText);
          onChange({ emmetText, lineNumber, column });
        } else {
          legalKey.set(false);
        }
        break;
      }
    }
  });
}

export function addTabCommand(
  editor: MonacoEditor,
  monaco: typeof Monaco,
  getStatus: () => EditorStatus
) {
  // add tab command with context
  editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      // attention: push an undo stop before and after executeEdits
      // to make sure undo operation works as expected
      editor.pushUndoStop();

      let { lineNumber, column, expandText, emmetText } = getStatus();

      // record first `FIELD` position and remove all `FIELD`
      const expandTextArr = expandText.split(FIELD);
      const posOffsetArr = expandTextArr[0].split("\n");

      const insertPosition = new monaco.Position(
        lineNumber + posOffsetArr.length - 1,
        posOffsetArr.length === 1
          ? posOffsetArr[0].length - emmetText.length + column
          : posOffsetArr.slice(-1)[0].length + 1
      );

      expandText = expandTextArr.join("");

      // replace range text with expandText
      editor.executeEdits("emmet", [
        {
          range: new monaco.Range(
            lineNumber,
            column - emmetText.length,
            lineNumber,
            column
          ),
          text: expandText,
          forceMoveMarkers: true
        }
      ]);

      // move cursor to the position of first `FIELD` in expandText
      editor.setPosition(insertPosition);

      editor.pushUndoStop();
    },
    // do not trigger emmet when suggest widget visible(it's a builtin context key)
    `${CONTEXT_KEY_ENABLED} && !suggestWidgetVisible && ${CONTEXT_KEY_LEGAL}`
  );
}
