module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/test/', '<rootDir>/src/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/test/'],
};
