import parseAbbreviation from "@emmetio/abbreviation";
import resolveSnippets from "@emmetio/html-snippets-resolver";
import format from "@emmetio/markup-formatters";
import transform from "@emmetio/html-transform";
import htmlSnippet from "@emmetio/snippets/html.json";
import SnippetsRegistry from "@emmetio/snippets-registry";
import Profile from "@emmetio/output-profile";

import {
  checkMonacoExists,
  caretChange,
  addTabCommand,
  MonacoEditor,
  defaultOption,
  getContextKey,
  EditorStatus
} from "./helper";

const option = {
  ...defaultOption,
  snippets: new SnippetsRegistry(htmlSnippet),
  profile: new Profile()
};

function expand(abbr: string) {
  const tree = parseAbbreviation(abbr)
    .use(resolveSnippets, option.snippets)
    .use(transform, null, null);

  return format(tree, option.profile, option);
}

/**
 * almost the same behavior as WebStorm's builtin emmet.
 * only triggered when string before text cursor(caret) matches emmet rules,
 * caret within html tag content area and suggest widget not visible,
 * otherwise will fallback to its original functionality.
 */
export default function emmetHTML(
  editor: MonacoEditor,
  monaco = window.monaco
) {
  if (!checkMonacoExists(monaco)) return;

  const status: EditorStatus = {
    lineNumber: 0,
    column: 0,
    emmetText: "",
    expandText: ""
  };

  // register a context key to make sure emmet triggered at proper condition
  const emmetLegal = getContextKey(editor);

  caretChange(
    editor,
    emmetLegal,
    (tokens, index) =>
      tokens[index].type === "" &&
      (index === 0 || tokens[index - 1].type === "delimiter.html"),
    str => {
      // empty or ends with white space, illegal
      if (str === "" || str.match(/\s$/)) return "";

      str = str.trim();

      // deal with white space, this determines how many characters needed to be emmeted
      // e.g. `a span div` => `a span <div></div>` skip `a span `
      // e.g. `a{111 222}` => `<a href="">111 222</a>`
      // conclusion: white spaces are only allowed between `[]` or `{}`
      // note: quotes also allowed white spaces, but quotes must in `[]` or `{}`, so skip it
      const step: { [key: string]: 1 | -1 } = {
        "{": 1,
        "}": -1,
        "[": 1,
        "]": -1
      };
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
      // but obviously it's not fit with html standard, so skip it
      if (!str.match(/^[a-zA-Z[(.#]/)) return "";

      // run expand to test the final result
      // `field` was used to set proper caret position after emmet
      try {
        status.expandText = expand(str);
      } catch (e) {
        return "";
      }

      return str;
    },
    s => Object.assign(status, s)
  );

  addTabCommand(editor, monaco, () => status);
}
