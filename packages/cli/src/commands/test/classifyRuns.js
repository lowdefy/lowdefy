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

// A journey replayed n times is PASS when every run passed, FAIL when every
// run failed, and FLAKY otherwise. Each failing run keeps its step and
// message, numbered from 1.
function classifyRuns({ runs }) {
  const passed = runs.filter((run) => run.passed).length;
  const failures = runs
    .map((run, index) => ({ run, number: index + 1 }))
    .filter(({ run }) => !run.passed)
    .map(({ run, number }) => ({
      run: number,
      step: run.failure?.index ?? null,
      message: run.message ?? run.failure?.message ?? null,
    }));
  let journeyClass = 'FLAKY';
  if (passed === runs.length) {
    journeyClass = 'PASS';
  } else if (passed === 0) {
    journeyClass = 'FAIL';
  }
  return { class: journeyClass, passed, total: runs.length, failures };
}

export default classifyRuns;
