import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import lowdefyPlugin from './scripts/eslint-rules/index.mjs';

const BROWSER_SOURCE = [
  'packages/client/**',
  'packages/client-core/**',
  'packages/layout/**',
  'packages/plugins/actions/**',
  'packages/plugins/blocks/!(blocks-native)/**',
  'packages/plugins/plugins/plugin-posthog/**',
  'packages/servers/*/client/**',
  'packages/utils/block-utils/**',
];

const NODE_SOURCE = [
  'apps/**',
  'scripts/**',
  'packages/api/**',
  'packages/build/**',
  'packages/cli/**',
  'packages/codemods/**',
  'packages/docs-content/**',
  'packages/plugins/connections/**',
  'packages/plugins/plugins/plugin-aws/**',
  'packages/plugins/plugins/plugin-azure/**',
  'packages/plugins/plugins/plugin-gcp/**',
  'packages/servers/*/lowdefy/**',
  'packages/servers/*/manager/**',
  'packages/servers/*/scripts/**',
  'packages/servers/*/src/**',
  'packages/utils/block-dev-e2e/**',
  'packages/utils/node-utils/**',
  'packages/utils/vite-yaml-plugin/**',
  '**/*.mjs',
  '**/*.config.js',
];

const NATIVE_SOURCE = [
  'packages/client-native/**',
  'packages/layout-native/**',
  'packages/plugins/blocks/blocks-native/**',
  'packages/shell/**',
  'packages/utils/style-native/**',
];

const TESTS = [
  '**/*.test.{js,jsx,mjs}',
  '**/test/**',
  '**/tests/**',
  '**/test-utils/**',
  '**/__mocks__/**',
  '**/vitest.setup.js',
  '**/mongodbGlobalSetup.js',
];

const E2E = ['**/e2e/**', '**/*.e2e.spec.js', '**/bench/**', 'packages/utils/e2e-utils/**'];

const NULL_COMPARISON = [
  {
    selector: "BinaryExpression[operator=/^[!=]=$/][right.type='Literal'][right.raw='null']",
    message:
      'Use `type.isNone(value)` from @lowdefy/helpers, which checks null and undefined (CLAUDE.md). In a package without @lowdefy/helpers, write `value === null || value === undefined`.',
  },
  {
    selector: "BinaryExpression[operator=/^[!=]=$/][left.type='Literal'][left.raw='null']",
    message:
      'Use `type.isNone(value)` from @lowdefy/helpers, which checks null and undefined (CLAUDE.md). In a package without @lowdefy/helpers, write `value === null || value === undefined`.',
  },
];

const TOP_LEVEL_ARROW = [
  {
    selector:
      ':matches(Program, Program > ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression).init',
    message:
      'Declare top-level functions with `function name() {}` (CLAUDE.md, "Function declarations for top-level/exported functions"). Arrow functions are for callbacks.',
  },
];

// Browser code is bundled by Vite, which replaces process.env.NODE_ENV and nothing else.
const BROWSER_PROCESS = [
  {
    selector: "MemberExpression[object.name='process'][property.name!='env']",
    message:
      'Browser code has no `process`. Vite replaces only `process.env.NODE_ENV`; read anything else from the Lowdefy context or pass it in.',
  },
  {
    selector:
      "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env'][property.name!='NODE_ENV']",
    message:
      'Browser code has no `process`. Vite replaces only `process.env.NODE_ENV`; read anything else from the Lowdefy context or pass it in.',
  },
];

// Shared between the browser and the server: engine, operators, helpers, the servers' lib/
// folders and everything not listed above.
const ISOMORPHIC_IGNORES = [...BROWSER_SOURCE, ...NODE_SOURCE, ...NATIVE_SOURCE];

// The recommended set, with every rule an error (warnings are ignored by agents and CI alike).
const PLAYWRIGHT_RULES = Object.fromEntries(
  Object.entries(playwright.configs['flat/recommended'].rules).map(([rule, level]) => [
    rule,
    level === 'warn' ? 'error' : level,
  ])
);

export default [
  {
    ignores: [
      // Build output, caches and generated files.
      '**/dist/',
      '**/es/',
      '**/coverage/',
      '**/.lowdefy/',
      '**/.next/',
      '**/.expo/',
      '**/.turbo/',
      '**/playwright-report/',
      '**/test-results/',
      '**/out/',
      '_server/',
      'packages/build/build/',
      'packages/docs/public/',
      'packages/plugins/blocks/blocks-table/bench/results/',
      'packages/servers/*/build/',
      'packages/servers/*/build-staging/',
      'packages/servers/*/.vercel/',
      'packages/servers/*/lowdefy-build/',
      'packages/servers/*/public/',
      'packages/shell/android/',
      'packages/shell/ios/',
      'packages/shell/web-build/',
      // Local working folders, agent tooling and dead code.
      '.agents/',
      '.claude/skills/',
      '.superpowers/',
      '.worktrees/',
      'app/',
      'modules/',
      'docs/superpowers/',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: {
      'lowdefy-repo': lowdefyPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals['shared-node-browser'],
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    rules: {
      'lowdefy-repo/license-header': 'error',
      'lowdefy-repo/react-in-jsx-scope': ['error', { runtime: 'classic' }],
      'lowdefy-repo/relative-import-extension': 'error',
      'array-callback-return': ['error', { checkForEach: false }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-nested-ternary': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
      ],
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-promise-reject-errors': 'error',
      'no-restricted-syntax': ['error', ...NULL_COMPARISON, ...TOP_LEVEL_ARROW],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/error-boundaries': 'error',
      'react-hooks/globals': 'error',
      'react-hooks/set-state-in-render': 'error',
      'react-hooks/void-use-memo': 'error',
    },
  },
  // Globals per runtime. Each file gets the globals of where it runs, so no-undef catches a
  // browser global in server code, a CommonJS global in an ES module, or a test function used
  // without importing it from vitest.
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    ignores: ISOMORPHIC_IGNORES,
    languageOptions: { globals: { ...globals.browser, ...globals.nodeBuiltin } },
  },
  {
    files: BROWSER_SOURCE,
    languageOptions: { globals: { ...globals.browser, process: 'readonly' } },
    rules: {
      'no-restricted-syntax': ['error', ...NULL_COMPARISON, ...TOP_LEVEL_ARROW, ...BROWSER_PROCESS],
    },
  },
  {
    files: NODE_SOURCE,
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: NATIVE_SOURCE,
    languageOptions: { globals: globals['react-native'] },
  },
  {
    files: ['**/*.cjs', 'packages/shell/*.js', 'packages/shell/native/**'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  // The JSX runtime is automatic in the Expo shell, the Next.js website and the Vite-built
  // servers, so React only needs to be in scope in swc-built packages.
  {
    files: ['packages/servers/**', 'packages/shell/**'],
    rules: { 'lowdefy-repo/react-in-jsx-scope': ['error', { runtime: 'automatic' }] },
  },
  // Unit tests run on vitest, which has no globals, so its functions must be imported.
  {
    files: TESTS,
    languageOptions: { globals: { ...globals.browser, ...globals.nodeBuiltin } },
    rules: {
      // Tests match ANSI colour codes in CLI output.
      'no-control-regex': 'off',
      'no-template-curly-in-string': 'off',
      // Tests throw non-errors on purpose to check how they are handled.
      'no-throw-literal': 'off',
      'prefer-promise-reject-errors': 'off',
      'react-hooks/globals': 'off',
      'no-restricted-syntax': ['error', ...NULL_COMPARISON],
    },
  },
  // CommonJS test stand-ins (module.exports) and the shell's tests, which read __dirname.
  {
    files: ['**/__mocks__/**', 'packages/shell/**/*.test.js', 'packages/shell/src/test/**'],
    languageOptions: { globals: globals.node },
  },
  // Playwright: block e2e specs and helpers, the e2e utilities and the table benchmark. Code
  // passed to page.evaluate runs in the browser.
  {
    files: E2E,
    languageOptions: { globals: { ...globals.browser, ...globals.nodeBuiltin } },
    rules: {
      'no-restricted-syntax': ['error', ...NULL_COMPARISON],
      // Playwright fixtures call use(), which is not React's use().
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/globals': 'off',
    },
  },
  {
    files: ['**/*.e2e.spec.js'],
    plugins: { playwright },
    rules: {
      ...PLAYWRIGHT_RULES,
      // Assertions are also made through the @lowdefy/e2e-utils expect* helpers and through a
      // block helper's expect namespace (blockHelper.expect.value(...)), both of which wrap the
      // expect() call. The rule only sees the last identifier of the callee, so the block helper
      // assertion names have to be listed by name.
      'playwright/expect-expect': [
        'error',
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
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      // Formatting is Prettier's job.
      'playwright/consistent-spacing-between-blocks': 'off',
      // Reports any variable named page*, such as a pagination button locator.
      'playwright/prefer-locator': 'off',
    },
  },
  // Console output is the point of scripts, the CLI's terminal tooling, the logger, tests and
  // e2e runs.
  {
    files: [
      ...TESTS,
      ...E2E,
      '**/*.mjs',
      '**/scripts/**',
      'packages/servers/*/lowdefy/**',
      'packages/utils/logger/**',
    ],
    rules: { 'no-console': 'off' },
  },
  // Tooling config files carry no license header.
  {
    files: ['**/*.config.{js,mjs,cjs}', 'eslint.config.mjs', '**/__mocks__/**'],
    rules: { 'lowdefy-repo/license-header': 'off' },
  },
];
