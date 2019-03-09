import { Node } from "@emmetio/abbreviation";

declare module "@emmetio/lorem" {
  interface LoremOption {
    lang: string;
    wordCount: number;
  }

  export default function lorem(node: Node, option: LoremOption): string;
}
