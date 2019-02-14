import { Snippet } from "@emmetio/snippets";

declare module "@emmetio/snippets-registry" {
  export default class SnippetsRegistry {
    constructor(snippets?: Snippet | Snippet[]);
  }
}
