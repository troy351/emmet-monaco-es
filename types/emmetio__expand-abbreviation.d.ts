declare module '@emmetio/expand-abbreviation' {
  export function parse(
    emmetStr: string,
  ): { walk: (node: any, level: number) => void }

  export function expand(emmetStr: string, options?: any): string
}
