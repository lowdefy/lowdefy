export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test', '<rootDir>/src/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // *.mongodb.test.js suites need a MongoDB server - pnpm test:mongodb runs
  // them (jest.mongodb.config.js).
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test', '\\.mongodb\\.test\\.js$'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../.swcrc.test' }],
  },
};
