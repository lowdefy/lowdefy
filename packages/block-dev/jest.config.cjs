module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!demo/*'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    'runRenderTests.js',
    'runMockRenderTests.js',
    'runMockMethodTests.js',
    'runBlockSchemaTests.js',
    'mockBlock.js',
  ],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'yaml', 'css'],
  transform: {
    '\\.js?$': 'babel-jest',
  },
  snapshotSerializers: ['@emotion/jest/serializer', 'jest-serializer-html'],
};
