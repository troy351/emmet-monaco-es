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

emmetMonaco.emmetJSX(monaco, ['mdx'])
monaco.editor.create(containers[0], {
  value: `# Hello

export function foo() {
  return <div className="foo" id="bar"></div>
}
`,
  language: 'mdx',
  theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs-light',
})
