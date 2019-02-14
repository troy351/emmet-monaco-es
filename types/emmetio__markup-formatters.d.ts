import { Tree } from "@emmetio/abbreviation";
import Profile from "@emmetio/output-profile";

declare module "@emmetio/markup-formatters" {
  export default function formatter(
    tree: Tree,
    profile: Profile,
    option: any
  ): any;
}
