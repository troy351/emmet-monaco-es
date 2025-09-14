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
  emmetMonaco.registerCustomSnippets('html', {
    ull: 'ul>li[id=${1} class=${2}]*2{ Will work with html, pug, haml and slim }',
    oll: '<ol><li id=${1} class=${2}> Will only work in html </ol>',
    ran: '{ Wrap plain text in curly braces }',
  })
  monaco.editor.create(containers[0], {
    value: '',
    language: 'html',
    suggest: {
      snippetsPreventQuickSuggestions: false,
    },
  })

  emmetMonaco.emmetCSS(monaco)
  monaco.editor.create(containers[1], {
    value: '',
    language: 'css',
  })

  emmetMonaco.emmetJSX(monaco)
  monaco.editor.create(containers[2], {
    value: '',
    language: 'javascript',
  })