export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test', '<rootDir>/src/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // Many suites start git, node or dev server processes, which take several
  // times longer on Windows runners than on Linux and pass jest's 5s default.
  testTimeout: 30000,
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
  // Only *.test.js files are suites; src/commands/test/test.js is the `lowdefy test` handler.
  testRegex: '\\.test\\.js$',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../.swcrc.test' }],
  },
};
