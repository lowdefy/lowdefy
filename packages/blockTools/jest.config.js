module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!demo/*'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/tests/',
    'runRenderTests.js',
    'mockBlock.js',
  ],
  coverageReporters: ['lcov', 'text', 'clover'],
  errorOnDeprecated: true,
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'yaml', 'css'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  transform: {
    '\\.yaml$': 'yaml-jest',
    '\\.js?$': 'babel-jest',
  },
};
