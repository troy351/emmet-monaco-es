import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js'

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return './vs/language/json/json.worker.js'
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './vs/language/css/css.worker.js'
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './vs/language/html/html.worker.js'
    }
    if (label === 'typescript' || label === 'javascript') {
      return './vs/language/typescript/ts.worker.js'
    }
    return './vs/editor/editor.worker.js'
  },
}

var containers = document.getElementsByClassName('container')

emmetMonaco.emmetHTML(monaco)
var editor = monaco.editor.create(containers[0], {
  value: '',
  language: 'html',
})

/**
 * vscode provide realtime preview and other things, we just do the simple things here.
 * here is the code how vscode does it:
 * https://github.com/microsoft/vscode/blob/eb21069624c0996f8c985b2ab8c5552be83ceff0/extensions/emmet/src/abbreviationActions.ts#L46
 */
editor.addAction({
  id: 'emmet-warp-with-abbreviation',
  label: 'Emmet: Wrap with Abbreviation',
  // add keybindings if any
  // keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10],
  run(editor) {
    // Monaco Editor does not provide `showInputBox` as vscode does,
    // just open a prompt instead here, can be replaced by other input boxes
    const abbr = window.prompt('Enter Abbreviation')

    const expanded = emmetMonaco.expandAbbreviation(abbr, {
      type: 'markup',
      syntax: 'html',
      options: {
        'output.field': (index, placeholder) => `\${${index}${placeholder ? ':' + placeholder : ''}}`,
      },
    })

    // match exists for sure
    const lastPlaceholder = `\${${expanded.match(/\$/g).length - 1}}`

    const model = editor.getModel()

    // take care of multi-selections
    const selectionsWithText = editor.getSelections().map((selection) => ({
      range: selection,
      text: model.getValueInRange(selection),
    }))

    editor.pushUndoStop()

    editor.executeEdits(
      'emmet',
      selectionsWithText.map(({ range, text }) => ({
        text: expanded.replace(/(\${\d+})/g, (matched) => (matched === lastPlaceholder ? text : '')),
        range,
      })),
    )

    editor.pushUndoStop()
  },
})
