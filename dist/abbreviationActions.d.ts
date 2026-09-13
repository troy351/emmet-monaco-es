import type * as Monaco from 'monaco-editor';
export type Tokenizer = 'monarch' | 'standard';
export interface EmmetOptions {
    tokenizer?: Tokenizer;
}
export declare function isValidLocationForEmmetAbbreviation(model: Monaco.editor.ITextModel, position: Monaco.Position, syntax: string, language: string, options?: EmmetOptions): boolean;
