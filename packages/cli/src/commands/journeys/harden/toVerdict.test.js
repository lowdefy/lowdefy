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

import toVerdict from './toVerdict.js';

const failure = { index: 2, message: 'Expected block "alert" to be visible.' };

test('toVerdict counts a failed step as a kill when the mutant was applied', () => {
  expect(toVerdict({ passed: false, failure, mutant: { applied: 1, misses: [] } })).toEqual({
    verdict: 'killed',
    failure,
  });
});

test('toVerdict counts a failed step as an error when the mutant was never applied', () => {
  const misses = [{ key: 'k', reason: 'not reached' }];
  expect(toVerdict({ passed: false, failure, mutant: { applied: 0, misses } })).toEqual({
    verdict: 'error',
    message:
      'The journey failed at step 2 (Expected block "alert" to be visible.), but the mutant was never applied, so the failure says nothing about it.',
    misses,
  });
});

test('toVerdict counts a passing run as survived when applied and unapplied when not', () => {
  expect(toVerdict({ passed: true, mutant: { applied: 2, misses: [] } })).toEqual({
    verdict: 'survived',
  });
  expect(toVerdict({ passed: true, mutant: { applied: 0, misses: ['m'] } })).toEqual({
    verdict: 'unapplied',
    misses: ['m'],
  });
});

test('toVerdict counts a run with no failed step and no pass as an error', () => {
  expect(toVerdict({ passed: false, message: 'Server did not answer.' })).toEqual({
    verdict: 'error',
    message: 'Server did not answer.',
  });
});
