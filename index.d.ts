import * as Monaco from "monaco-editor";

type Dispose = () => void;

/**
 * emmet for `CSS` / `LESS` / `SCSS`
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetCSS(monaco?: typeof Monaco): Dispose;

/**
 * emmet for `HTML`
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetHTML(monaco?: typeof Monaco): Dispose;

/**
 * emmet for `JSX` / `TSX`
 * @param monaco monaco self, if not provided, will use window.monaco
 */
export function emmetJSX(monaco?: typeof Monaco): Dispose;
