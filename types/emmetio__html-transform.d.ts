import { Tree } from "@emmetio/abbreviation";

declare module "@emmetio/html-transform" {
  export default function format(
    tree: Tree,
    content: string | null,
    appliedAddons: object | null
  ): string;
}
