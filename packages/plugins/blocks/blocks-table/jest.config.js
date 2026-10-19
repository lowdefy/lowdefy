/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Unit tests cover the pure functions of the table core and features. Blocks are tested
// end to end with Playwright (src/**/tests/*.e2e.spec.js), which Jest skips.
export default {
  clearMocks: true,
  collectCoverage: true,
  // React components and hooks are covered by the e2e suite.
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/use*.js',
    '!src/**/[A-Z]*.js',
    '!src/**/*Feature.js',
    '!src/**/handle*.js',
    '!src/blocks/**',
    '!src/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/bench/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
  },
};
