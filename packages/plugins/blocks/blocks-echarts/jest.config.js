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

export default {
  clearMocks: true,
  collectCoverage: true,
  // Only the static report renderers are unit-tested here; the block component
  // pulls in React/echarts-for-react and is exercised by the e2e suite instead.
  collectCoverageFrom: ['src/static/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/static/index.js'],
  coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // Only `.test.js` unit tests run under Jest; the `.e2e.spec.js` suites belong
  // to Playwright (`pnpm e2e`) and must not be collected here.
  testMatch: ['<rootDir>/src/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
  },
};
