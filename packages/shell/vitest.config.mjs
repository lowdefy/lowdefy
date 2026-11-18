import path from 'path';
import { fileURLToPath } from 'url';
import { configDefaults, defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

const testDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src/test');

// vitest-native's native engine runs React Native's own JavaScript, Flow stripped with
// @react-native/babel-preset as @lowdefy/client-native's tests are (Metro uses babel.config.js
// with babel-preset-expo), and mocks only the native modules and host components.
//
// @expo/ui, expo-image, expo-web-browser and expo-speech-recognition reach native modules a test
// does not have, so the native blocks' pickers, switch, icon, date picker, menu, segmented
// control, bottom sheet, pictures, in-app browser and dictation recogniser are stand-ins
// (src/test/) that keep their props. So are the Expo modules the shell's own services and device
// features load.
export default defineConfig({
  plugins: [
    reactNative({
      engine: 'native',
      presets: { svg: false },
      // The native Markdown block's react-native-marked ships TypeScript source. The shell reaches it
      // through @lowdefy/blocks-native, so vitest-native does not find it among its dependencies.
      transform: ['react-native-marked'],
    }),
  ],
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    // Metro compiles the shell with the automatic JSX runtime (babel-preset-expo).
    jsx: { runtime: 'automatic', development: false },
  },
  resolve: {
    alias: [
      ['^@expo/ui$', 'expoUi.js'],
      ['^@expo/ui/community/bottom-sheet$', 'expoUiBottomSheet.js'],
      ['^@expo/ui/community/datetime-picker$', 'expoUiDateTimePicker.js'],
      ['^@expo/ui/community/menu$', 'expoUiMenu.js'],
      ['^@expo/ui/community/segmented-control$', 'expoUiSegmentedControl.js'],
      ['^@expo/ui/swift-ui$', 'expoUiSwiftUi.js'],
      ['^@expo/ui/swift-ui/modifiers$', 'expoUiSwiftUiModifiers.js'],
      ['^expo-image$', 'expoImage.js'],
      ['^expo-speech-recognition$', 'expoSpeechRecognition.js'],
      ['^expo-web-browser$', 'expoWebBrowser.js'],
      ['^expo-notifications$', 'expoNotifications.js'],
      ['^expo-quick-actions$', 'expoQuickActions.js'],
      ['^expo-(task-manager|background-task)$', 'expoTaskManager.js'],
      [
        '^(expo-(audio|brightness|calendar|calendar/legacy|contacts|document-picker|file-system|haptics|image-picker|keep-awake|location|maps|sharing|speech|widgets)|react-native-nfc-manager|react-native-document-scanner-plugin)$',
        'nativeModule.js',
      ],
    ].map(([find, file]) => ({ find: new RegExp(find), replacement: path.join(testDir, file) })),
  },
  test: {
    environment: 'node',
    // The *.test.mjs files are node:test suites the test script runs with `node --test`.
    exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**', '**/*.test.mjs'],
    setupFiles: ['./src/test/resetColorScheme.js'],
    clearMocks: true,
    maxWorkers: 2,
    // A file's first render loads and compiles the engine, client-core and React Native for that
    // file, about 2.5s on a laptop and past the 5s default on a busy CI runner.
    testTimeout: 30000,
  },
});
