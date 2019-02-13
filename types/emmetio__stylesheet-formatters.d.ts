import Profile from "@emmetio/output-profile";
import { Tree } from "@emmetio/css-abbreviation";

declare module "@emmetio/stylesheet-formatters" {
  export default function stringify(
    tree: Tree,
    profile: Profile,
    option: any
  ): string;
}
