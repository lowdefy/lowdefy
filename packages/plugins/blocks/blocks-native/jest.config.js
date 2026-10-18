// The blocks render under React Native's own Jest preset, inside @lowdefy/client-native's page
// renderer, as a shell draws them. The workspace packages they import resolve to their dist folders
// outside node_modules, so babel-jest compiles them too.
export default {
  preset: '@react-native/jest-preset',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/'],
  coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  setupFiles: ['<rootDir>/src/test/removeWindow.js'],
  // The preset's pattern assumes a flat node_modules; pnpm nests each package under .pnpm.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|react-native-svg|change-case|intl-messageformat|@formatjs)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/'],
};
