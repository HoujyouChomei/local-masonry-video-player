// eslint.config.mjs

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';

export default [
  { ignores: ['dist', 'dist-electron', 'release', 'src/components/ui'] },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'boundaries': boundaries,
      'import': importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages/*' },
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],

      // ========================================================
      // FSD Architecture Rules 
      // ========================================================
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: 'widgets',
              disallow: ['app', 'pages', 'widgets'],
              message: 'FSD Violation: Widgets must not import from App, Pages, or other Widgets. Use Dependency Injection (Render Props) instead.',
            },
            {
              from: 'features',
              disallow: ['app', 'pages', 'widgets', 'features'],
              message: 'FSD Violation: Features must not import from upper layers or sibling Features.',
            },
            {
              from: 'entities',
              disallow: ['app', 'pages', 'widgets', 'features', 'entities'],
              message: 'FSD Violation: Entities must only import from Shared layer.',
            },
            {
              from: 'shared',
              disallow: ['app', 'pages', 'widgets', 'features', 'entities'],
              message: 'FSD Violation: Shared layer must not import from any other layer.',
            },
          ],
        },
      ],
    },
  },
];