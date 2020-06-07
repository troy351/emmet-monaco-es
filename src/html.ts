import parseAbbreviation from "@emmetio/abbreviation";
import resolveSnippets from "@emmetio/html-snippets-resolver";
import format from "@emmetio/markup-formatters";
import transform from "@emmetio/html-transform";
import htmlSnippet from "@emmetio/snippets/html.json";
import SnippetsRegistry from "@emmetio/snippets-registry";
import Profile from "@emmetio/output-profile";
import lorem, { LoremOption } from "@emmetio/lorem";
import replaceVariables from "@emmetio/variable-resolver";

import { checkMonacoExists, onCompletion, defaultOption } from "./helper";
import { htmlData } from './htmlData';

htmlData.tags.forEach(tag => htmlSnippet[tag as keyof typeof htmlSnippet] = htmlSnippet[tag as keyof typeof htmlSnippet] || tag)
const registry = new SnippetsRegistry(htmlSnippet);

// add lorem
const reLorem = /^lorem([a-z]*)(\d*)$/i;

registry.get(0).set(reLorem, node => {
  const option: LoremOption = {} as any;
  const [, lang, wordCount] = node.name.match(reLorem)!;
  if (lang) option.lang = lang;
  if (wordCount) option.wordCount = +wordCount;
  return lorem(node, option);
});

const markupSnippetKeys = registry
  .all({ type: "string" })
  .map(snippet => snippet.key);
// add extra lorem
markupSnippetKeys.push("lorem");

const option = {
  ...defaultOption,
  snippets: registry,
  profile: new Profile(),
  variables: {
    lang: "en",
    locale: "en-US",
    charset: "UTF-8"
  }
};

function expand(abbr: string) {
  const tree = parseAbbreviation(abbr)
    .use(resolveSnippets, option.snippets)
    .use(replaceVariables, option.variables)
    .use(transform, null, null);

  return format(tree, option.profile, option);
}

/**
 * almost the same behavior as VSCode's builtin emmet.
 * only available when string before text cursor(caret) matches emmet rules.
 */
export default function emmetHTML(monaco = window.monaco) {
  if (!checkMonacoExists(monaco)) return;

  return onCompletion(
    monaco,
    "html",
    (tokens, index) =>
      (tokens[index].type === "" &&
        (index === 0 || tokens[index - 1].type === "delimiter.html")) ||
      // #7 compatible with https://github.com/NeekSandhu/monaco-textmate
      tokens[0].type === "text.html.basic",
    str => {
      // empty or ends with white space, illegal
      if (str === "" || str.match(/\s$/)) return;

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
      if (!str.match(/^[a-zA-Z[(.#!]/)) return;

      // provide all possible abbreviation completions
      const strlen = str.length;
      // match all snippet starts with the given `str` but not `str` itself
      const strArr = markupSnippetKeys.filter(
        key => key.length > strlen && key.slice(0, strlen) === str
      );
      // prepend `str` itself
      strArr.unshift(str);

      try {
        return strArr.map(s => ({
          emmetText: s,
          expandText: expand(s)
        }));
      } catch {
        return;
      }
    }
  );
}
