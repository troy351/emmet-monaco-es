import { type MarkupAbbreviation, type StylesheetAbbreviation, type UserConfig } from 'emmet';
import type * as Monaco from 'monaco-editor';
type TextModel = Monaco.editor.ITextModel;
type CompletionList = Monaco.languages.CompletionList;
type Position = Monaco.IPosition;
export interface SnippetsMap {
    [name: string]: string;
}
/**
 * Emmet configuration as derived from the Emmet related VS Code settings
 */
export interface VSCodeEmmetConfig {
    showExpandedAbbreviation?: string;
    showAbbreviationSuggestions?: boolean;
    syntaxProfiles?: object;
    variables?: object;
    preferences?: object;
    excludeLanguages?: string[];
    showSuggestionsAsSnippets?: boolean;
}
/**
 * Returns all applicable emmet expansions for abbreviation at given position in a CompletionList
 * @param model TextModel in which completions are requested
 * @param position Position in the document at which completions are requested
 * @param syntax Emmet supported language
 * @param emmetConfig Emmet Configurations as derived from VS Code
 */
export declare function doComplete(monaco: typeof Monaco, model: TextModel, position: Position, syntax: string, emmetConfig: VSCodeEmmetConfig): CompletionList | undefined;
/** Returns the default syntax (html or css) to use for the snippets registry */
export declare function getDefaultSyntax(syntax: string): string;
/**
 * Assigns snippets from one snippet file under emmet.extensionsPath to
 * customSnippetsRegistry, snippetKeyCache, and stylesheetCustomSnippetsKeyCache
 */
export declare function registerCustomSnippets(syntax: string, customSnippets: SnippetsMap): void;
/**
 * Expands given abbreviation using given options
 * @param abbreviation string or parsed abbreviation
 * @param config options used by the @emmetio/expand-abbreviation module to expand given abbreviation
 */
export declare function expandAbbreviation(abbreviation: string | MarkupAbbreviation | StylesheetAbbreviation, config: UserConfig): string;
export {};
