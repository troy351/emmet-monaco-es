import { checkMonacoExists, onCompletion } from "./helper";
import { getHTMLLegalEmmetSets } from "./html";

/**
 * almost the same behavior as VSCode's builtin emmet.
 * only available when string before text cursor(caret) matches emmet rules.
 */
export default function emmetJSX(
  monaco = window.monaco,
  languages: string[] = ["javascript"]
) {
  if (!checkMonacoExists(monaco)) return;

  return onCompletion(
    monaco,
    languages,
    true,
    // This is a rough token check, because monaco doesn't have accurate tokens as vscode does
    (tokens, index) =>
      tokens[index].type === "identifier.js" ||
      tokens[index].type === "identifier.ts",
    getHTMLLegalEmmetSets
  );
}
