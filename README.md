# emmet-monaco-es
Emmet Plugin for monaco-editor

**compatible with monaco-editor v0.12.0 and above**

Source codes are well commented if you want to figure out how it works

# Install
```shell
$ npm install emmet-monaco-es
```

# Example
```javascript
import { emmetHTML, emmetCSS } from 'emmet-monaco-es'

// both `emmetHTML` and `emmetCSS` are used the same way
emmetHTML(
  editor, // monaco editor instance
  monaco // monaco self. If not provided, will use window.monaco instead
);
```

# Limitations
Treeshaking not work properly, PR welcome if you know how to fix it.

# License
MIT
