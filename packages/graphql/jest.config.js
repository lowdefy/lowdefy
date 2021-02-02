module.exports = {
  // displayName: 'normal',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // preset: '@shelf/jest-mongodb',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
};
