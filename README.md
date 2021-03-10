# emmet-monaco-es

<p>
  <a href="https://npmcharts.com/compare/emmet-monaco-es?minimal=true"><img src="https://img.shields.io/npm/dm/emmet-monaco-es.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/emmet-monaco-es"><img src="https://img.shields.io/npm/v/emmet-monaco-es.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/emmet-monaco-es"><img src="https://img.shields.io/npm/l/emmet-monaco-es.svg" alt="License"></a>
</p>

Emmet Support for [Monaco Editor](https://github.com/Microsoft/monaco-editor)

## Compatibility

Compatible with Monaco Editor `v0.22.0` and above.

_If you are using old version of Monaco Editor, Please use `v4.4.2` of this lib._

## Advantage

- Almost the same as VSCode's built-in emmet, integrated with completion provider.
- `HTML` / `JSX` / `TSX` / `PHP` / `TWIG` / `CSS` / `LESS` / `SCSS` support
- Treeshaking support

## Install

```shell
$ npm install emmet-monaco-es
```

## Usage

#### NOTE

The `emmet` functionality was bind to language features not to a specific editor instance.

- `emmetHTML` works for `HTML` / `PHP` / `TWIG`
- `emmetCSS` works for `CSS` / `LESS` / `SCSS`
- `emmetJSX` works for `JSX` / `TSX`

_Follow [this](https://github.com/microsoft/monaco-editor/issues/264#issuecomment-654578687) guide to make Monaco Editor support `TSX`_

#### ESM

```javascript
import { emmetHTML, emmetCSS, emmetJSX, expandHTML, expandCSS } from "emmet-monaco-es";

// `emmetHTML` , `emmetCSS` and `emmetJSX` are used the same way
const dispose = emmetHTML(
  // monaco-editor it self. If not provided, will use window.monaco instead.
  // This could make the plugin support both ESM and AMD loaded monaco-editor
  monaco
);

// run it if you want to dispose emmet
dispose();

// internal expand API, if you want to extend functionality with emmet
expandHTML('a'); // <a href="${1}">${2}</a>
expandCSS('fz14'); // font-size: 14px;
```

#### Browser

```html
<script src="https://unpkg.com/emmet-monaco-es/dist/emmet-monaco.min.js"></script>
<script>
  // NOTE: monaco-editor should be loaded first
  // see above esm example for details
  emmetMonaco.emmetHTML(monaco);
</script>
```

## Limitation

Does **NOT** support Emmet for embed CSS inside HTML / JSX / TSX

## License

MIT
