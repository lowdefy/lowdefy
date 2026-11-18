import { configDefaults, defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

// vitest-native's native engine runs React Native's own JavaScript, Flow stripped with
// @react-native/babel-preset, and mocks only the native modules and host components.
export default defineConfig({
  plugins: [reactNative({ engine: 'native', presets: { svg: false } })],
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    jsx: { runtime: 'classic', development: false },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**'],
    setupFiles: ['./src/test/removeWindow.js', './src/test/resetColorScheme.js'],
    clearMocks: true,
    maxWorkers: 2,
    // A file's first render loads and compiles the engine, client-core and React Native for that
    // file, about 2.5s on a laptop and past the 5s default on a busy CI runner.
    testTimeout: 30000,
  },
});
