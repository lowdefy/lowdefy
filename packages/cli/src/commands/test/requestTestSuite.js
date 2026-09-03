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
import discoverRequestTests from './discoverRequestTests.js';
import formatRequestTestResult from './formatRequestTestResult.js';
import runRequestTest from './runRequestTest.js';

// The request test suite (tests/requests/*.test.yaml), registered in test.js
// beside the journey suite. `getSeeds` is read before the dev server boots so
// the in-memory MongoDB's URI can be handed to the server as connection
// overrides.
const requestTestSuite = {
  name: 'requests',
  getItemName: (item) => item.test?.name ?? item.filePath,
  getSeeds: (item) => ({ seed: item.test?.seed, fixtures: item.test?.fixtures }),
  discover: discoverRequestTests,
  run: runRequestTest,
  format: formatRequestTestResult,
};

export default requestTestSuite;
