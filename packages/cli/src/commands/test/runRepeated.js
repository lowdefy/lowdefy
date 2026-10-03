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

import classifyRuns from './classifyRuns.js';

// Runs one test item `repeat` times in a row and returns one result: the
// newest run's result with the class, the pass count and every run. A test the
// runner refused outright (an invalid file) fails once and is not repeated -
// it would fail the same way every time.
async function runRepeated({ suite, context, item, url, repeat }) {
  const runs = [];
  for (let repetition = 1; repetition <= repeat; repetition += 1) {
    const run = await suite.run({ context, item, url });
    runs.push(run);
    if (run.refused === true) {
      break;
    }
  }
  const classified = classifyRuns({ runs });
  const newest = runs[runs.length - 1];
  const firstFailure = runs.find((run) => !run.passed);
  return {
    ...newest,
    ...(firstFailure ? { failure: firstFailure.failure, message: firstFailure.message } : {}),
    journey: item.journey,
    newestPassed: newest.passed,
    passed: classified.class === 'PASS',
    class: classified.class,
    repeat,
    runs: classified.total,
    passedRuns: classified.passed,
    failures: classified.failures,
    durationMs: Math.round(runs.reduce((sum, run) => sum + run.durationMs, 0) / runs.length),
  };
}

export default runRepeated;
