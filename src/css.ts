import format from "@emmetio/stylesheet-formatters";
import resolveSnippets from "@emmetio/css-snippets-resolver";
import cssSnippet from "@emmetio/snippets/css.json";
import parseAbbreviation from "@emmetio/css-abbreviation";
import SnippetsRegistry from "@emmetio/snippets-registry";
import Profile from "@emmetio/output-profile";

import {
  checkMonacoExists,
  caretChange,
  addTabCommand,
  MonacoEditor,
  defaultOption,
  getContextKey,
  EditorStatus,
  FIELD
} from "./helper";

const option = {
  ...defaultOption,
  snippets: new SnippetsRegistry(cssSnippet),
  profile: new Profile()
};

function expand(abbr: string) {
  const tree = parseAbbreviation(abbr).use(resolveSnippets, option.snippets);
  return format(tree, option.profile, option);
}

/**
 * almost the same behavior as WebStorm's builtin emmet.
 * only triggered when cursor(caret) not in attribute value area and do works via emmet,
 * otherwise will fallback to its original functionality.
 */
export default function emmetCSS(editor: MonacoEditor, monaco = window.monaco) {
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
      // stop emmet when at attribute.value
      tokens[index].type.substring(0, 15) !== "attribute.value",
    str => {
      // empty or ends with white space, illegal
      if (str === "" || str.match(/\s$/)) return "";

      // find last substring after `{` or `}` or `;`
      str = str
        .trim()
        .split(/{|}|;/)
        .pop()!;

      if (!str) return "";

      // run expand to test the final result
      // `field` was used to set proper caret position after emmet
      try {
        const expandText = expand(str);

        // expand fail
        if (expandText === `${str}: ${FIELD};`) return "";

        status.expandText = expandText;
      } catch (e) {
        return "";
      }

      return str;
    },
    s => Object.assign(status, s)
  );

  addTabCommand(editor, monaco, () => status);
}
