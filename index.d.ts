import * as Monaco from "monaco-editor";

/**
 * emmet for css/scss/less
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetCSS(monaco?: typeof Monaco): () => void;

/**
 * emmet for html
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetHTML(monaco?: typeof Monaco): () => void;
