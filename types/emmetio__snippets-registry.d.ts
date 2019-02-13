declare module "@emmetio/snippets-registry" {
  export default class SnippetsRegistry {
    constructor();
    public add(snippets: { [key: string]: string }): void;
  }
}
