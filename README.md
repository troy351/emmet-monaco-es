# emmet-monaco-es

<p>
  <a href="https://npmcharts.com/compare/emmet-monaco-es?minimal=true"><img src="https://img.shields.io/npm/dm/emmet-monaco-es.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/emmet-monaco-es"><img src="https://img.shields.io/npm/v/emmet-monaco-es.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/emmet-monaco-es"><img src="https://img.shields.io/npm/l/emmet-monaco-es.svg" alt="License"></a>
</p>

Emmet Plugin for [monaco-editor](https://github.com/Microsoft/monaco-editor)

**compatible with monaco-editor v0.12.0 and above**

Treeshaking support

Source codes are well commented if you want to figure out how it works

# Install

```shell
$ npm install emmet-monaco-es
```

# Example

```javascript
import { emmetHTML, emmetCSS } from "emmet-monaco-es";

// both `emmetHTML` and `emmetCSS` are used the same way
const dispose = emmetHTML(
  // monaco editor instance,
  // i.e. instance created by monaco.editor.create()
  editor,
  // monaco-editor it self. If not provided, will use window.monaco instead.
  // This could make the plugin support both ESM and AMD loaded monaco-editor
  monaco
);

// run it if you want to dispose emmet
// NOTE: `dispose` would be undefined if emmetHTML twice with the same editor without any dispose in between
dispose();
```

# TODO
- More reasonable `dispose`, can't dispose `editor.addCommand` for now. See [Microst/monaco-editor#942](https://github.com/Microsoft/monaco-editor/issues/942)

# License

MIT
