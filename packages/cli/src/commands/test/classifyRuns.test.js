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
import isFullSuiteRun from './isFullSuiteRun.js';

const pass = { passed: true };
function fail(index) {
  return { passed: false, failure: { index }, message: `step ${index} failed` };
}

test('classifyRuns calls 3 of 3 passes PASS', () => {
  expect(classifyRuns({ runs: [pass, pass, pass] })).toEqual({
    class: 'PASS',
    passed: 3,
    total: 3,
    failures: [],
  });
});

test.each([
  [[pass, fail(4), pass], 2, [{ run: 2, step: 4, message: 'step 4 failed' }]],
  [
    [fail(1), pass, fail(2)],
    1,
    [
      { run: 1, step: 1, message: 'step 1 failed' },
      { run: 3, step: 2, message: 'step 2 failed' },
    ],
  ],
])(
  'classifyRuns calls a mix of passes and failures FLAKY with each failing run',
  (runs, passed, failures) => {
    expect(classifyRuns({ runs })).toEqual({ class: 'FLAKY', passed, total: 3, failures });
  }
);

test('classifyRuns calls 0 of 3 passes FAIL', () => {
  expect(classifyRuns({ runs: [fail(2), fail(2), fail(2)] }).class).toEqual('FAIL');
});

test('classifyRuns keeps the message of a run that failed before any step', () => {
  expect(classifyRuns({ runs: [{ passed: false, message: 'Invalid journey file' }] })).toEqual({
    class: 'FAIL',
    passed: 0,
    total: 1,
    failures: [{ run: 1, step: null, message: 'Invalid journey file' }],
  });
});

test.each([
  [{ paths: undefined, filter: undefined, repetition: 1 }, true],
  [{ paths: [], filter: '', repetition: 1 }, true],
  [{ paths: undefined, filter: undefined, repetition: 2 }, false],
  [{ paths: ['tests/journeys/a.yaml'], filter: undefined, repetition: 1 }, false],
  [{ paths: undefined, filter: 'invite', repetition: 1 }, false],
])('isFullSuiteRun(%j) is %s', (options, expected) => {
  expect(isFullSuiteRun(options)).toBe(expected);
});

test('classifyRuns marks a run that failed on opening its page, with no step', () => {
  const openFailure = {
    passed: false,
    failure: { phase: 'open', kind: 'app-error', message: 'Opening the page caused an app error' },
    message: 'Opening the page caused an app error',
  };
  expect(classifyRuns({ runs: [openFailure, openFailure] })).toEqual({
    class: 'FAIL',
    passed: 0,
    total: 2,
    failures: [1, 2].map((run) => ({
      run,
      step: null,
      phase: 'open',
      message: 'Opening the page caused an app error',
    })),
  });
  expect(classifyRuns({ runs: [openFailure, pass] }).class).toEqual('FLAKY');
});
