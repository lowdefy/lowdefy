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
    // ERROR:
    // ../lowdefy/.yarn/cache/yaml-npm-2.1.1.zip/node_modules/yaml/browser/index.js:3
    // import * as YAML from './dist/index.js';
    // SyntaxError: Cannot use import statement outside a module
    // {
    //   displayName: 'CLIENT',
    //   clearMocks: true,
    //   collectCoverage: true,
    //   collectCoverageFrom: ['src/**/*.js'],
    //   coverageDirectory: 'coverage',
    //   coveragePathIgnorePatterns: [
    //     '<rootDir>/dist/',
    //     '<rootDir>/src/test',
    //     '<rootDir>/src/index.js',
    //     '<rootDir>/src/operatorsBuild.js',
    //     '<rootDir>/src/operatorsClient.js',
    //     '<rootDir>/src/operatorsServer.js',
    //     '<rootDir>/src/types.js',
    //   ],
    //   coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
    //   errorOnDeprecated: true,
    //   testEnvironment: 'jsdom',
    //   testPathIgnorePatterns: [
    //     '<rootDir>/dist/',
    //     '<rootDir>/src/test',
    //     '<rootDir>/src/operators/server',
    //     '<rootDir>/src/operators/build',
    //   ],
    //   transformIgnorePatterns: ['/node_modules/(?!(yaml)/)'],
    //   transform: {
    //     '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
    //   },
    // },
  ],
};
