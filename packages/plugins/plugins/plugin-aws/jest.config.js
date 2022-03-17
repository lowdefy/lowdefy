export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/src/index.js',
    '<rootDir>/src/blocks.js',
    '<rootDir>/src/connections.js',
    '<rootDir>/src/types.js',
  ],
  coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
    '\\.yaml$': 'jest-transform-yaml',
  },
  snapshotSerializers: ['@emotion/jest/serializer', 'jest-serializer-html'],
};
