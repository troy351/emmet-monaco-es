import * as Monaco from "monaco-editor";

type Dispose = () => void;

/**
 * emmet for `CSS` / `LESS` / `SCSS`
 * @param monaco monaco self, if not provided, will use window.monaco
 * @param languages languages needs to support, default `['css']`. Should support any CSS compatible languages like `scss`,`less` 
 */
export function emmetCSS(monaco?: typeof Monaco, languages?: string[]): Dispose;

/**
 * emmet for `HTML`
 * @param monaco monaco self, if not provided, will use window.monaco
 * @param languages languages needs to support, default `['html']`. Should support any HTML compatible languages like `php`,`twig` 
 */
export function emmetHTML(
  monaco?: typeof Monaco,
  languages?: string[]
): Dispose;

/**
 * emmet for `JSX` / `TSX`
 * @param monaco monaco self, if not provided, will use window.monaco
 * @param languages languages needs to support, default `['javascript']`. Should support any jsx compatible languages like `typescript`
 */
export function emmetJSX(monaco?: typeof Monaco, languages?: string[]): Dispose;

/**
 * internal api, expand `HTML`
 * @param abbr emmet abbr word
 */
export function expandHTML(abbr: string): string;

/**
 * internal api, expand `CSS` / `LESS` / `SCSS`
 * @param abbr emmet abbr word
 */
export function expandCSS(abbr: string): string;
