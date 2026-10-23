import { defineConfig, mergeConfig } from 'vitest/config';

import config from './vitest.config.js';

// test:full runs the engine suite with dependency tracking off, so every update is a full pass.
export default mergeConfig(
  config,
  defineConfig({
    test: {
      setupFiles: ['./test/fullEvaluation.js'],
    },
  })
);
