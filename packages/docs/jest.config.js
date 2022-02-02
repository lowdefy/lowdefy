export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/.lowdefy/',
    '<rootDir>/jest.config.js',
    '<rootDir>/coverage/',
  ],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/.lowdefy/',
    '<rootDir>/jest.config.js',
    '<rootDir>/coverage/',
  ],
};
