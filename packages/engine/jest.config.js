module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/test/'],
  coverageReporters: ['lcov', 'text', 'clover'],
  errorOnDeprecated: true,

  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/dist/'],
};
