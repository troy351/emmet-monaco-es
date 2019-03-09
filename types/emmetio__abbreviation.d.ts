declare module "@emmetio/abbreviation" {
  export interface Node {
    name: string;
    parent: Node | null;
    next: Node | null;
    previous: Node | null;
    children: Node[];
    value: string;
  }

  export interface Tree {
    children: Node[];
    use(plugin: any, ...args: any[]): this;
  }

  export default function parse(emmetStr: string, option?: any): Tree;
}
