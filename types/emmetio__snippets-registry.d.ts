import { Snippet } from "@emmetio/snippets";
import { Node } from "@emmetio/abbreviation";

declare module "@emmetio/snippets-registry" {
  class SnippetsStorage {
    set(key: string | RegExp, value: string | ((node: Node) => void)): this;
  }

  export default class SnippetsRegistry {
    constructor(snippets?: Snippet | Snippet[]);
    get(index: number): SnippetsStorage;
    all(option: any): Array<{ key: string }>;
  }
}
