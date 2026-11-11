import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // Build output and generated files, mirroring .gitignore.
  {
    ignores: [
      '**/dist/',
      '**/es/',
      '**/coverage/',
      '**/.lowdefy/',
      '**/.next/',
      '**/.expo/',
      '**/playwright-report/',
      '**/test-results/',
      '**/out/',
      '**/.turbo/',
      '.agents/',
      '.claude/skills/',
      '.superpowers/',
      '.worktrees/',
      '_server/',
      'app/',
      'modules/',
      'docs/superpowers/',
      'packages/build/build/',
      'packages/plugins/blocks/blocks-table/bench/results/',
      'packages/servers/*/build/',
      'packages/servers/*/build-staging/',
      'packages/servers/*/.vercel/',
      'packages/servers/*/lowdefy-build/',
      'packages/servers/*/public/',
      'packages/shell/android/',
      'packages/shell/ios/',
      'packages/shell/web-build/',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  importPlugin.flatConfigs.errors,
  importPlugin.flatConfigs.warnings,
  prettierRecommended,
  {
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    linterOptions: {
      // ESLint 8 did not report unused disable directives. Some name react-hooks rules, which
      // are not enabled.
      reportUnusedDisableDirectives: 'off',
    },
    settings: {
      'import/resolver': 'node',
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'warn',
      'no-nested-ternary': 'warn',
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // ESLint 9 changed the default to 'all'.
          caughtErrors: 'none',
          // Destructure-to-omit, e.g. `const { drop, ...rest } = obj` — `drop` is
          // intentionally pulled out to exclude it from `rest`.
          ignoreRestSiblings: true,
        },
      ],
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
      'import/no-unresolved': [
        'error',
        {
          // Because of https://github.com/import-js/eslint-plugin-import/issues/1868
          ignore: [
            '^@lowdefy/.*$',
            // Exports-map-only packages (no "main"), which the node resolver cannot read.
            '^@tanstack/(react-table|react-virtual)$',
          ],
        },
      ],
    },
  },
  // Server packages import build-time generated artifacts (../build/*) and runtime deps that
  // ship exports maps the legacy import resolver can't follow, so unresolved-import checks only
  // produce false positives there.
  {
    files: ['packages/servers/**/*.{js,jsx}'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  // Playwright e2e tests
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.e2e.spec.js'],
  },
  {
    files: ['**/*.e2e.spec.js'],
    rules: {
      // eslint-plugin-import can't resolve Playwright's TypeScript exports.
      'import/named': 'off',
      // Assertions are also made through the @lowdefy/e2e-utils expect* helpers and through a
      // block helper's expect namespace (blockHelper.expect.value(...)), both of which wrap the
      // expect() call. The rule only sees the last identifier of the callee, so the block helper
      // assertion names have to be listed by name.
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionPatterns: ['^expect'],
          assertFunctionNames: [
            'closed',
            'dateDisabled',
            'dateEnabled',
            'endValue',
            'noPresets',
            'placeholder',
            'presetDisabled',
            'presetEnabled',
            'presetLabelHtml',
            'presetLabels',
            'startValue',
            'value',
          ],
        },
      ],
    },
  },
  // Playwright e2e utilities and block helpers
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
