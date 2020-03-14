import { Tree } from "@emmetio/css-abbreviation";

declare module "@emmetio/variable-resolver" {
  export default function replaceVariables(
    tree: Tree,
    variables: Record<string, string>,
  ): Tree;
}
