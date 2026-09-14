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
  // Only the static report renderers are unit-tested here; block components
  // pull in React and are exercised by the e2e suite instead.
  collectCoverageFrom: ['src/**/*.static.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/'],
  coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  // Only the co-located `*.static.test.js` report-renderer suites run under
  // Jest; block-component e2e specs belong to Playwright (`pnpm e2e`).
  testMatch: ['<rootDir>/src/**/*.static.test.js'],
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../../../.swcrc.test' }],
  },
};
