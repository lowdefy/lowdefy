import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

import rootConfig from '../../eslint.config.mjs';

// Every rule is an error or off, as in the root config.
const nextRules = Object.fromEntries(
  Object.entries(nextPlugin.configs['core-web-vitals'].rules).map(([rule, level]) => [
    rule,
    level === 'warn' ? 'error' : level,
  ])
);

export default [
  ...rootConfig,
  {
    ...nextPlugin.configs['core-web-vitals'],
    rules: {
      ...nextRules,
      // The site uses the app router; this rule only checks a pages/ directory.
      '@next/next/no-html-link-for-pages': 'off',
      // The site is a static export with unoptimized images, so next/image adds nothing.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.nodeBuiltin } },
    rules: {
      // The website has never carried the license header.
      'lowdefy-repo/license-header': 'off',
      // Next.js resolves extensionless imports and the "@/" alias.
      'lowdefy-repo/relative-import-extension': 'off',
      // Pages show code samples in strings.
      'no-template-curly-in-string': 'off',
      // Next.js uses the automatic JSX runtime.
      'lowdefy-repo/react-in-jsx-scope': ['error', { runtime: 'automatic' }],
    },
  },
  {
    files: ['*.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
];
