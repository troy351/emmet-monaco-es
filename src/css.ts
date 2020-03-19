import format from "@emmetio/stylesheet-formatters";
import resolveSnippets from "@emmetio/css-snippets-resolver";
import cssSnippet from "@emmetio/snippets/css.json";
import parseAbbreviation from "@emmetio/css-abbreviation";
import SnippetsRegistry from "@emmetio/snippets-registry";
import Profile from "@emmetio/output-profile";

import { checkMonacoExists, onCompletion, defaultOption } from "./helper";

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
 * almost the same behavior as VSCode's builtin emmet.
 * only available when string before text cursor(caret) matches emmet rules.
 */
export default function emmetCSS(monaco = window.monaco) {
  if (!checkMonacoExists(monaco)) return;

  return onCompletion(
    monaco,
    ["css", "less", "scss"],
    (tokens, index) =>
      // stop emmet when at attribute.value
      tokens[index].type.substring(0, 15) !== "attribute.value",
    str => {
      // empty or ends with white space, illegal
      if (str === "" || str.match(/\s$/)) return;

      // find last substring after `{` or `}` or `;`
      str = str
        .trim()
        .split(/{|}|;/)
        .pop()!;

      if (!str) return;

      try {
        return [
          {
            emmetText: str,
            expandText: expand(str)
          }
        ];
      } catch {
        return;
      }
    }
  );
}
