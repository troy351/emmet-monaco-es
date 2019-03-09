import { Node } from "@emmetio/abbreviation";

declare module "@emmetio/css-abbreviation" {
  export interface Tree {
    children: Node[];
    use(plugin: any, ...args: any[]): this;
  }

  export default function parse(emmetStr: string, option?: any): Tree;
}
