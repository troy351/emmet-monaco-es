import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/emmet-monaco.common.js',
        format: 'cjs',
        exports: 'named',
      },
      {
        file: 'dist/emmet-monaco.esm.js',
        format: 'esm',
        exports: 'named',
      },
      {
        file: 'dist/emmet-monaco.js',
        name: 'emmetMonaco',
        format: 'iife',
      },
    ],
    watch: {
      exclude: 'node_modules/**',
    },
    plugins: [commonjs(), resolve(), typescript()],
    external: ['monaco-editor'],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/emmet-monaco.common.min.js',
        format: 'cjs',
        exports: 'named',
      },
      {
        file: 'dist/emmet-monaco.esm.min.js',
        format: 'esm',
        exports: 'named',
      },
      {
        file: 'dist/emmet-monaco.min.js',
        name: 'emmetMonaco',
        format: 'iife',
      },
    ],
    watch: {
      exclude: 'node_modules/**',
    },
    plugins: [commonjs(), resolve(), typescript(), terser()],
    external: ['monaco-editor'],
  },
]
