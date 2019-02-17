import * as Monaco from "monaco-editor";

/**
 * emmet for css/scss/less
 * @param editor monaco-editor instance
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetCSS(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco?: typeof Monaco
): (() => void) | undefined;

/**
 * emmet for html
 * @param editor monaco-editor instance
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetHTML(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco?: typeof Monaco
): (() => void) | undefined;
