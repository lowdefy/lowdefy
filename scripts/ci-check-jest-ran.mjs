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

/*
  Fails when a jest run (its `--json --outputFile` result) passed no test. Suites that skip
  every test when their environment is missing (the journey fixture suites with no
  Chromium) would otherwise pass in CI having proved nothing.

  Usage: node scripts/ci-check-jest-ran.mjs <jest json result file>
*/

import fs from 'node:fs';

const resultFile = process.argv[2];
const { numPassedTests, numPendingTests, numTotalTests } = JSON.parse(
  fs.readFileSync(resultFile, 'utf8')
);
console.log(
  `${resultFile}: ${numPassedTests} passed, ${numPendingTests} skipped, ${numTotalTests} total.`
);
if (numPassedTests === 0) {
  console.error('No test passed: the suite skipped every test, so this run proves nothing.');
  process.exit(1);
}
