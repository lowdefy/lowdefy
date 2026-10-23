import { defineConfig, mergeConfig } from 'vitest/config';

import config from './vitest.config.js';

// test:compiled runs the engine suite with every parse compiled from the first call.
export default mergeConfig(
  config,
  defineConfig({
    test: {
      setupFiles: ['./test/compileFirstParse.js'],
    },
  })
);
