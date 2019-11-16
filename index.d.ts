import * as Monaco from "monaco-editor";

type Dispose = () => void;

/**
 * emmet for css/scss/less
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetCSS(monaco?: typeof Monaco): Dispose;

/**
 * emmet for html
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetHTML(monaco?: typeof Monaco): Dispose;
