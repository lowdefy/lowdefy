export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/src/test',
    '<rootDir>/src/index.js',
    '<rootDir>/src/scripts/run.js',
  ],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // Fixture tests run whole builds, which exceed jest's 5s default when several
  // worktrees build and test at once.
  testTimeout: 30000,
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/tests/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../.swcrc.test' }],
  },
};
