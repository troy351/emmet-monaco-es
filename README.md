# emmet-monaco-es

<p>
  <a href="https://npmcharts.com/compare/emmet-monaco-es?minimal=true"><img src="https://img.shields.io/npm/dm/emmet-monaco-es.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/emmet-monaco-es"><img src="https://img.shields.io/npm/v/emmet-monaco-es.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/emmet-monaco-es"><img src="https://img.shields.io/npm/l/emmet-monaco-es.svg" alt="License"></a>
</p>

Emmet Support for [Monaco Editor](https://github.com/Microsoft/monaco-editor), based on [vscode-emmet-helper](https://github.com/microsoft/vscode-emmet-helper)

## Advantage

- Almost the same as VSCode's built-in emmet, integrated with completion provider
- Various languages support

## Install

```shell
$ npm install emmet-monaco-es
```

## Usage

#### NOTE

The `emmet` functionality was bound to language features not to a specific editor instance.

- `emmetHTML` works for `HTML` compatible languages, like `PHP`, for `html` only by default
- `emmetCSS` works for `CSS` compatible languages, like `LESS` / `SCSS`, for `css` only by default
- `emmetJSX` works for `JSX` compatible languages, like `JavaScript` / `TypeScript` / `MDX`, for `javascript` only by default

_Follow [this](https://github.com/microsoft/monaco-editor/issues/264#issuecomment-654578687) guide to make Monaco Editor support `TSX`_

**Initialize emmet should BEFORE all monaco editor instance creation**

#### ESM

```javascript
import { emmetHTML, emmetCSS, emmetJSX, expandAbbreviation, registerCustomSnippets } from 'emmet-monaco-es'

// `emmetHTML` , `emmetCSS` and `emmetJSX` are used the same way
const dispose = emmetHTML(
  // monaco-editor it self. If not provided, will use window.monaco instead.
  // This could make the plugin support both ESM and AMD loaded monaco-editor
  monaco,
  // languages needs to support html markup emmet, should be lower case.
  ['html', 'php'],
)

// run it if you want to dispose emmetHTML.
// NOTE: all languages specified will be disposed.
dispose()

// internal expand API, if you want to extend functionality with emmet
// check out the emmet repo https://github.com/emmetio/emmet for how to use it
expandAbbreviation('a', { type: 'markup', syntax: 'html' }) // <a href=""></a>
expandAbbreviation('fz14', { type: 'stylesheet', syntax: 'css' }) // font-size: 14px;

// register custom snippets
registerCustomSnippets('html', {
  ull: 'ul>li[id=${1} class=${2}]*2{ Will work with html, pug, haml and slim }',
  oll: '<ol><li id=${1} class=${2}> Will only work in html </ol>',
  ran: '{ Wrap plain text in curly braces }',
})
```

#### Browser

```html
<script src="https://unpkg.com/emmet-monaco-es/dist/emmet-monaco.min.js"></script>
<script>
  // NOTE: monaco-editor should be loaded first
  // see the above esm example for details
  emmetMonaco.emmetHTML(monaco)
</script>
```

## Limitation

Does **NOT** support Emmet for embed CSS inside HTML / JSX / TSX

## License

MIT
