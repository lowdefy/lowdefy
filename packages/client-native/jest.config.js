// The renderer runs under React Native's own Jest preset: babel-jest with the React Native
// Babel preset, React Native's module mocks and a node environment. The workspace packages it
// imports resolve to their dist folders outside node_modules, so babel-jest compiles them too.
export default {
  preset: '@react-native/jest-preset',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/', '<rootDir>/src/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  setupFiles: ['<rootDir>/src/test/removeWindow.js'],
  // The preset's pattern assumes a flat node_modules; pnpm nests each package under .pnpm.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|change-case|intl-messageformat|@formatjs)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/'],
};
