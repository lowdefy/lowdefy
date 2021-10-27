module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/src/test',
    '<rootDir>/demo/',
    '<rootDir>/src/blocks/Icon/icons/',
    'generateIcons.js',
  ],
  coverageReporters: [['lcov', { projectRoot: '../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/es/', '<rootDir>/src/test'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '^antd/.*/style$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  transform: {
    '\\.js?$': 'babel-jest',
    '\\.yaml$': 'jest-transform-yaml',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'yaml', 'css'],
  snapshotSerializers: ['jest-serializer-html', '@emotion/jest/serializer'],
};
