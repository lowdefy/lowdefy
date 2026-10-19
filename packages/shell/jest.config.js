// The shell's modules run under React Native's own Jest preset, compiled with React Native's Babel
// preset as @lowdefy/client-native's tests are (Metro uses babel.config.js with babel-preset-expo).
// The workspace packages it imports resolve to their dist folders outside node_modules, so
// babel-jest compiles them too.
module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: ['module:@react-native/babel-preset'],
        plugins: ['@babel/plugin-transform-class-static-block'],
      },
    ],
  },
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/src/test/'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  // @expo/ui, expo-image, expo-web-browser and expo-speech-recognition reach native modules Jest
  // does not have, so the native blocks' pickers, switch, icon, date picker, menu, segmented
  // control, bottom sheet, pictures, in-app browser and dictation recogniser are stand-ins
  // (src/test/) that keep their props.
  moduleNameMapper: {
    '^@expo/ui$': '<rootDir>/src/test/expoUi.js',
    '^@expo/ui/community/bottom-sheet$': '<rootDir>/src/test/expoUiBottomSheet.js',
    '^@expo/ui/community/datetime-picker$': '<rootDir>/src/test/expoUiDateTimePicker.js',
    '^@expo/ui/community/menu$': '<rootDir>/src/test/expoUiMenu.js',
    '^@expo/ui/community/segmented-control$': '<rootDir>/src/test/expoUiSegmentedControl.js',
    '^@expo/ui/swift-ui$': '<rootDir>/src/test/expoUiSwiftUi.js',
    '^@expo/ui/swift-ui/modifiers$': '<rootDir>/src/test/expoUiSwiftUiModifiers.js',
    '^expo-image$': '<rootDir>/src/test/expoImage.js',
    '^expo-speech-recognition$': '<rootDir>/src/test/expoSpeechRecognition.js',
    '^expo-web-browser$': '<rootDir>/src/test/expoWebBrowser.js',
  },
  // The preset's pattern assumes a flat node_modules; pnpm nests each package under .pnpm. The
  // native Markdown block's react-native-marked ships TypeScript source and marked ES modules, and
  // the AgentChat block's AI SDK (ai, @ai-sdk/*) and its dependencies ship ES modules.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native(-svg|-marked|-reanimated-table)?|marked|@jsamr|github-slugger|@react-native(-community)?|expo(nent)?|@expo|expo-[^/]+|change-case|intl-messageformat|@formatjs|mingo|uuid|yaml|cron-parser|cronstrue|luxon|jsonata|deep-diff|nunjucks|ai|@ai-sdk|eventsource-parser|throttleit|swr|zod|@standard-schema|@vercel/oidc|@workflow)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/', '<rootDir>/node_modules/'],
};
