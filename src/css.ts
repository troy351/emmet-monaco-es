import stringify from "@emmetio/stylesheet-formatters";
import resolveSnippets from "@emmetio/css-snippets-resolver";
import SnippetsRegistry from "@emmetio/snippets-registry";
import Profile from "@emmetio/output-profile";
import parse from "@emmetio/css-abbreviation";

import {
  checkMonacoExists,
  caretChange,
  addTabCommand,
  MonacoEditor,
  option,
  getContextKey,
  EditorStatus,
  FIELD
} from "./helper";

const registry = new SnippetsRegistry();
registry.add({
  "@kf": "@keyframes ${1:identifier} {\n\t${2}\n}",
  bg: "background:#${1:000}",
  bga: "background-attachment:fixed|scroll",
  bgbk: "background-break:bounding-box|each-box|continuous",
  bgi: "background-image:url(${0})",
  bgo: "background-origin:padding-box|border-box|content-box",
  c: "color:#${1:000}",
  cl: "clear:both|left|right|none",
  pos: "position:relative|absolute|fixed|static",
  m: "margin",
  p: "padding",
  z: "z-index:1",
  bd: "border:${1:1px} ${2:solid} ${3:#000}",
  bds:
    "border-style:hidden|dotted|dashed|solid|double|dot-dash|dot-dot-dash|wave|groove|ridge|inset|outset",
  lg: "background-image:linear-gradient(${1})",
  trf: "transform:scale(${1:x-coord}, ${2:y})",
  mten: "margin: 10px;"
});

/**
 * almost the same behavior as WebStorm's builtin emmet.
 * only triggered when cursor(caret) not in attribute value area and do works via emmet,
 * otherwise will fallback to its original functionality.
 */
export default function emmetCSS(editor: MonacoEditor, monaco = window.monaco) {
  if (!checkMonacoExists(monaco)) return;

  function expand(abbr: string) {
    const tree = resolveSnippets(parse(abbr), registry);
    return stringify(tree, new Profile(), option);
  }

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
