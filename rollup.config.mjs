import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const external = ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'];

/** @type {import('rollup').RollupOptions[]} */
export default [
  // Main bundle (CJS + ESM)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined,
      }),
      terser(),
    ],
  },
  // Router integration bundle (CJS + ESM)
  {
    input: 'src/router/index.ts',
    output: [
      {
        file: 'dist/router.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/router.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined,
      }),
      terser(),
    ],
  },
  // Type declarations — main
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    external,
    plugins: [dts()],
  },
  // Type declarations — router
  {
    input: 'src/router/index.ts',
    output: {
      file: 'dist/router.d.ts',
      format: 'esm',
    },
    external,
    plugins: [dts()],
  },
];
