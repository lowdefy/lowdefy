export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.mjs', 'lowdefy/**/*.mjs'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageReporters: [['lcov', { projectRoot: '../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.mjs'],
  transform: {},
};
