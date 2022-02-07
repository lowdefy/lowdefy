export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/.lowdefy/',
    '<rootDir>/jest.config.js',
    '<rootDir>/coverage/',
    '<rootDir>/howto/',
  ],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/.lowdefy/',
    '<rootDir>/jest.config.js',
    '<rootDir>/coverage/',
    '<rootDir>/howto/',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../.swcrc.test' }],
  },
};
