module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  coveragePathIgnorePatterns: ['/tests/', '/demo/'],
  transform: {
    '\\.yaml$': 'yaml-jest',
    '\\.js?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'yaml', 'css'],
};
