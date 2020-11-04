module.exports = {
  projects: [
    {
      displayName: 'normal',
      clearMocks: true,
      collectCoverage: true,
      collectCoverageFrom: ['src/**/*.js'],
      coverageDirectory: 'coverage',
      coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
      coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
      errorOnDeprecated: true,
      testEnvironment: 'node',
      testPathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/src/test',
        '<rootDir>/src/connections/mongodb',
      ],
    },
    {
      displayName: 'mongodb',
      clearMocks: true,
      collectCoverage: true,
      collectCoverageFrom: ['src/**/*.js'],
      coverageDirectory: 'coverage',
      coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
      coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
      errorOnDeprecated: true,
      testEnvironment: 'node',
      preset: '@shelf/jest-mongodb',
      roots: ['<rootDir>/src/connections/mongodb'],
    },
  ],
};
