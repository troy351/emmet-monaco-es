import * as Monaco from "monaco-editor";

declare global {
  interface Window {
    monaco?: typeof Monaco;
  }
}

export const defaultOption = {
  field: (index: number, placeholder: string) =>
    `\${${index}${placeholder ? ":" + placeholder : ""}}`
};

export function checkMonacoExists(
  monaco?: typeof Monaco
): monaco is typeof Monaco {
  if (!monaco)
    console.error(
      "emmet-monaco-es: 'monaco' should be either declared on window or passed as first parameter"
    );

  return !!monaco;
}

interface Token {
  readonly offset: number;
  readonly type: string;
  readonly language: string;
}

interface EmmetSet {
  emmetText: string;
  expandText: string;
}

/**
 * add completion provider
 * @param monaco monaco self
 * @param language added language
 * @param isLegalToken check whether given token is legal or not
 * @param getLegalEmmetSets get legal emmet substring from a string.
 */
export function onCompletion(
  monaco: typeof Monaco,
  language: string | string[],
  isLegalToken: (tokens: Token[], index: number) => boolean,
  getLegalEmmetSets: (emmetText: string) => EmmetSet[] | undefined
) {
  const isHTML = language === "html";
  if (typeof language === "string") language = [language];

  const providers = language.map(lang =>
    monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ">+-^*()#.[]$@{}=!:%".split(""),
      provideCompletionItems: (model, position) => {
        const { column, lineNumber } = position;

        // there is nothing before caret, return
        if (
          column === 1 ||
          column <= model.getLineFirstNonWhitespaceColumn(lineNumber)
        ) {
          return;
        }

        // inspired by `monaco.editor.tokenize`.
        // see source map from `https://microsoft.github.io/monaco-editor/`
        // `_tokenization._tokenizationSupport` for version 0.18.0 and above
        const tokenizationSupport =
          (model as any)._tokens.tokenizationSupport ||
          (model as any)._tokenization._tokenizationSupport;
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

        let setArr: ReturnType<typeof getLegalEmmetSets>;

        // get token type at current column
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (column - 1 > tokens[i].offset) {
            // type must be empty string when start emmet
            // and if not the first token, make sure the previous token is `delimiter.html`
            // to prevent emmet triggered within attributes
            if (isLegalToken(tokens, i)) {
              // get content between current token offset and current cursor column
              setArr = getLegalEmmetSets(
                model
                  .getLineContent(lineNumber)
                  .substring(tokens[i].offset, column - 1)
              );
            }
            break;
          }
        }

        if (!setArr) return;

        return {
          suggestions: setArr.map(({ emmetText, expandText }) => {
            const label = isHTML
              ? emmetText
              : // https://github.com/microsoft/vscode-emmet-helper/blob/075cb1736582383d75f0dc9e2252e73643e55f59/src/emmetHelper.ts#L271
                expandText
                  .replace(/([^\\])\$\{\d+\}/g, "$1")
                  .replace(/\$\{\d+:([^\}]+)\}/g, "$1");

            return {
              kind: monaco.languages.CompletionItemKind.Property,
              label: label,
              // Workaround for the main expanded abbr not appearing before the snippet suggestions
              sortText: "0" + label,
              insertText: expandText,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: new monaco.Range(
                lineNumber,
                column - emmetText.length,
                lineNumber,
                column
              ),
              detail: "Emmet Abbreviation",
              // https://github.com/microsoft/vscode-emmet-helper/blob/075cb1736582383d75f0dc9e2252e73643e55f59/src/emmetHelper.ts#L267
              documentation: expandText
                .replace(/([^\\])\$\{\d+\}/g, "$1|")
                .replace(/\$\{\d+:([^\}]+)\}/g, "$1")
            };
          }),
          incomplete: true
        };
      }
    })
  );

  return () => {
    providers.forEach(provider => provider.dispose());
  };
}
