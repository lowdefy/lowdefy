/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import playwrightPlugin from 'eslint-plugin-playwright';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  importPlugin.flatConfigs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },
    },
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      'import/resolver': 'node',
      react: { version: 'detect' },
    },
    rules: {
      'no-console': 'warn',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'warn',
      'no-nested-ternary': 'warn',
      'react/display-name': 'off',
      'react/jsx-filename-extension': 'off',
      'react/prop-types': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/no-array-index-key': 'off',
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-indent': 'off',
      'react/jsx-props-no-spreading': 'warn',
      'react/destructuring-assignment': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'import/extensions': ['error', 'ignorePackages'],
      'import/no-unresolved': ['error', { ignore: ['^@lowdefy\\/.*$'] }],
    },
  },
  {
    files: ['**/*.e2e.spec.js'],
    ...playwrightPlugin.configs['flat/recommended'],
    rules: {
      ...playwrightPlugin.configs['flat/recommended'].rules,
      'import/named': 'off',
    },
  },
  {
    files: [
      'packages/utils/e2e-utils/src/**/*.js',
      'packages/plugins/blocks/*/src/blocks/*/e2e.js',
    ],
    rules: {
      'import/named': 'off',
    },
  },
];
