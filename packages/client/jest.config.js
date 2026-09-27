export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test', '<rootDir>/src/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/src/test/__mocks__/styleMock.js',
    // @ant-design/icons 6.3+ resolves to es/*.js under jsdom, and its CommonJS build requires
    // @ant-design/colors/es/generate. Both are ES module syntax in packages without
    // "type": "module", which jest 28 can't load (Node and Vite can). Use the CommonJS builds.
    '^@ant-design/icons$': '<rootDir>/node_modules/@ant-design/icons/lib/index.js',
    '^@ant-design/colors/es/(.*)$': '@ant-design/colors/lib/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../.swcrc.test' }],
    '\\.yaml$': '@lowdefy/jest-yaml-transform',
  },
  snapshotSerializers: ['jest-serializer-html'],
};
