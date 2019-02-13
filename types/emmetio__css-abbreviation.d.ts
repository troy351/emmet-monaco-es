declare module "@emmetio/css-abbreviation" {
  interface Node {
    parent: Node | null;
    next: Node | null;
    previous: Node | null;
    children: Node[];
  }

  export interface Tree {
    children: Node[];
  }

  export default function parse(emmetStr: string): Tree;
}
