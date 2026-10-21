export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // A suite's first test imports the module under test, and with it the AI SDK,
  // transformed and instrumented for coverage. On a busy Windows runner that
  // import takes longer than Jest's 5 second default.
  testTimeout: 30000,
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../.swcrc.test' }],
  },
};
