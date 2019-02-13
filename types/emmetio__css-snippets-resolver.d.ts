import { Tree } from "@emmetio/css-abbreviation";
import SnippetsRegistry from "@emmetio/snippets-registry";

declare module "@emmetio/css-snippets-resolver" {
  export default function resolveSnippets(
    tree: Tree,
    registry: SnippetsRegistry
  ): Tree;
}
