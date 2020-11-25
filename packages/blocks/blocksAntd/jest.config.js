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
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '^antd/.*/style$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  transform: {
    '\\.yaml$': 'yaml-jest',
    '\\.js?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'yaml', 'css'],
  snapshotSerializers: ['jest-serializer-html'],
};
