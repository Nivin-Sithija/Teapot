import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // react-three-fiber's JSX elements (<meshStandardMaterial />, <group />…)
      // are three.js classes, not DOM tags — the unknown-property rule has no
      // way to know that and flags every material prop.
      'react/no-unknown-property': 'off',
    },
  },
];

export default config;
