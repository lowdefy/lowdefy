export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.mjs', 'manager/**/*.mjs'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/manager/utils/getNextBin.mjs'],
  coverageReporters: [['lcov', { projectRoot: '../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.mjs'],
  // Served from a running fixture app: jest.fixture.config.mjs.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/journeyFixture/'],
  transform: {},
};
