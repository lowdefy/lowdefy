export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.mjs', 'manager/**/*.mjs'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/manager/utils/getNextBin.mjs'],
  coverageReporters: [['lcov', { projectRoot: '../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.mjs'],
  // Many suites start processes or Chromium and touch many files, which take
  // several times longer on Windows runners than on Linux and pass jest's 5s
  // default.
  testTimeout: 30000,
  // Served from a running fixture app: jest.fixture.config.mjs. *.mongodb.test.mjs
  // suites need a MongoDB server - pnpm test:mongodb runs them (jest.mongodb.config.mjs).
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/test/journeyFixture/',
    '\\.mongodb\\.test\\.mjs$',
  ],
  transform: {},
};
