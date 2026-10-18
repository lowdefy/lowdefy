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
  // @expo/ui reaches native modules Jest does not have, so the native blocks' pickers, switch and
  // date picker are stand-ins (src/test/expoUi.js) that keep their props.
  moduleNameMapper: {
    '^@expo/ui$': '<rootDir>/src/test/expoUi.js',
    '^@expo/ui/community/datetime-picker$': '<rootDir>/src/test/expoUiDateTimePicker.js',
  },
  // The preset's pattern assumes a flat node_modules; pnpm nests each package under .pnpm. The
  // native Markdown block's react-native-marked ships TypeScript source and marked ES modules.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native(-svg|-marked|-reanimated-table)?|marked|@jsamr|github-slugger|@react-native(-community)?|expo(nent)?|@expo|expo-[^/]+|change-case|intl-messageformat|@formatjs|mingo|uuid|yaml|cron-parser|cronstrue|luxon|jsonata|deep-diff|nunjucks)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/', '<rootDir>/node_modules/'],
};
