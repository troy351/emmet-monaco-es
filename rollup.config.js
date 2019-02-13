import typescript from "rollup-plugin-typescript";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/emmet-monaco.common.js",
      format: "cjs",
      exports: "named"
    },
    {
      file: "dist/emmet-monaco.esm.js",
      format: "esm",
      exports: "named"
    }
  ],
  watch: {
    exclude: "node_modules/**"
  },
  plugins: [commonjs(), resolve(), typescript()],
  external: ["monaco-editor"]
};
