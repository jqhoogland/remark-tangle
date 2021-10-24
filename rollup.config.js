/**
 * Based on: https://hackernoon.com/building-and-publishing-a-module-with-typescript-and-rollup-js-faa778c85396
 */

import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
  ],
    plugins: [
    typescript({
      typescript: require('typescript'),
      tsconfig: "tsconfig.json",
      abortOnError: false
    }),
  ],
}