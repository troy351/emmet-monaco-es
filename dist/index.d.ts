import type * as Monaco from 'monaco-editor';
import { EmmetOptions } from './abbreviationActions';
declare global {
    interface Window {
        monaco?: typeof Monaco;
    }
}
/**
 * emmet for `HTML`
 * @param monaco monaco self, if not provided, will use window.monaco
 * @param languages language IDs to support, default `['html']`. Should support any HTML compatible languages like `php`,`twig`
 * @param options emmet options. `options.tokenizer` sets the tokenizer engine, default `'monarch'`. Use `'standard'` when a non-Monarch grammar (e.g. shiki) is active.
 */
export declare function emmetHTML(monaco?: any, languages?: string[], options?: EmmetOptions): () => void;
/**
 * emmet for `CSS` / `LESS` / `SCSS`
 * @param monaco monaco self, if not provided, will use window.monaco
 * @param languages language IDs to support, default `['css']`. Should support any CSS compatible languages like `scss`,`less`
 * @param options emmet options. `options.tokenizer` sets the tokenizer engine, default `'monarch'`. Use `'standard'` when a non-Monarch grammar (e.g. shiki) is active.
 */
export declare function emmetCSS(monaco?: any, languages?: string[], options?: EmmetOptions): () => void;
/**
 * emmet for `JSX` / `TSX`
 * @param monaco monaco self, if not provided, will use window.monaco
 * @param languages language IDs to support, default `['javascript']`. Should support any jsx compatible languages like `typescript`
 * @param options emmet options. `options.tokenizer` sets the tokenizer engine, default `'monarch'`. Use `'standard'` when a non-Monarch grammar (e.g. shiki) is active.
 */
export declare function emmetJSX(monaco?: any, languages?: string[], options?: EmmetOptions): () => void;
export { expandAbbreviation, registerCustomSnippets } from './emmetHelper';
