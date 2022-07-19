export default {
  projects: [
    {
      displayName: 'SERVER',
      clearMocks: true,
      collectCoverage: true,
      collectCoverageFrom: ['src/**/*.js'],
      coverageDirectory: 'coverage',
      coveragePathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/src/test',
        '<rootDir>/src/index.js',
        '<rootDir>/src/operatorsBuild.js',
        '<rootDir>/src/operatorsClient.js',
        '<rootDir>/src/operatorsServer.js',
        '<rootDir>/src/types.js',
      ],
      coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
      errorOnDeprecated: true,
      testEnvironment: 'node',
      testPathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/src/test',
        '<rootDir>/src/operators/client',
      ],
      transform: {
        '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
      },
    },
    {
      displayName: 'CLIENT',
      clearMocks: true,
      collectCoverage: true,
      collectCoverageFrom: ['src/**/*.js'],
      coverageDirectory: 'coverage',
      coveragePathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/src/test',
        '<rootDir>/src/index.js',
        '<rootDir>/src/operatorsBuild.js',
        '<rootDir>/src/operatorsClient.js',
        '<rootDir>/src/operatorsServer.js',
        '<rootDir>/src/types.js',
      ],
      coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
      errorOnDeprecated: true,
      testEnvironment: 'jsdom',
      testPathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/src/test',
        '<rootDir>/src/operators/server',
        '<rootDir>/src/operators/build',
      ],
      transform: {
        '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
      },
    },
  ],
};
