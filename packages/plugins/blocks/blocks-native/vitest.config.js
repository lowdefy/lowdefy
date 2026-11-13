import path from 'path';
import { fileURLToPath } from 'url';
import { configDefaults, defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

const testDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src/test');

// vitest-native's native engine runs React Native's own JavaScript, Flow stripped with
// @react-native/babel-preset, and mocks only the native modules and host components.
//
// @expo/ui draws SwiftUI and Jetpack Compose views through native modules a test does not have,
// so its pickers, switch, icon, date picker, menu, segmented control and bottom sheet are
// replaced by small React Native stand-ins (src/test/expoUi*.js) that keep their props,
// expo-image's Image by one too (src/test/expoImage.js), expo-web-browser's in-app browser by a
// mock (src/test/expoWebBrowser.js), and expo-speech-recognition's recogniser by a stand-in tests
// drive (src/test/expoSpeechRecognition.js).
export default defineConfig({
  plugins: [reactNative({ engine: 'native', presets: { svg: false } })],
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    jsx: { runtime: 'classic', development: false },
  },
  resolve: {
    alias: [
      ['^@expo/ui$', 'expoUi.js'],
      ['^@expo/ui/community/bottom-sheet$', 'expoUiBottomSheet.js'],
      ['^@expo/ui/community/datetime-picker$', 'expoUiDateTimePicker.js'],
      ['^@expo/ui/community/menu$', 'expoUiMenu.js'],
      ['^@expo/ui/community/segmented-control$', 'expoUiSegmentedControl.js'],
      ['^@expo/ui/swift-ui/modifiers$', 'expoUiSwiftUiModifiers.js'],
      ['^expo-image$', 'expoImage.js'],
      ['^expo-speech-recognition$', 'expoSpeechRecognition.js'],
      ['^expo-web-browser$', 'expoWebBrowser.js'],
    ].map(([find, file]) => ({ find: new RegExp(find), replacement: path.join(testDir, file) })),
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
