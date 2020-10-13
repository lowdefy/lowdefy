module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js'],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text'],
  errorOnDeprecated: true,
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
};
