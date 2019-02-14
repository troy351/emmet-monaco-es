import { Tree } from "@emmetio/abbreviation";
import SnippetsRegistry from "@emmetio/snippets-registry";

declare module "@emmetio/html-snippets-resolver" {
  export default function resolveSnippets(
    tree: Tree,
    registry: SnippetsRegistry
  ): Tree;
}
