import nextPlugin from '@next/eslint-plugin-next';

import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  nextPlugin.configs['core-web-vitals'],
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
    },
  },
];
