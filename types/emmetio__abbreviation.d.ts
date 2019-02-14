declare module "@emmetio/abbreviation" {
  interface Node {
    parent: Node | null;
    next: Node | null;
    previous: Node | null;
    children: Node[];
  }

  export interface Tree {
    children: Node[];
    use(plugin: any, ...args: any[]): this;
  }

  export default function parse(emmetStr: string, option?: any): Tree;
}
