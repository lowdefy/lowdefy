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

import { expect, test } from 'vitest';

import summariseResults from './summariseResults.js';

function result({ resultClass = 'PASS', contended }) {
  return { class: resultClass, ...(contended ? { contended: true } : {}) };
}

test('summariseResults counts passes, failures and journeys', () => {
  expect(
    summariseResults({
      results: [result({}), result({}), result({ resultClass: 'FAIL' })],
      skipped: 0,
    })
  ).toEqual({ failed: 1, text: '2 passed, 1 failed of 3 journeys' });
});

test('summariseResults counts the passes that came after an alone rerun', () => {
  expect(
    summariseResults({
      results: [result({ contended: true }), result({}), result({ contended: true })],
      skipped: 0,
    })
  ).toEqual({ failed: 0, text: '3 passed (2 after an alone rerun), 0 failed of 3 journeys' });
});

test('summariseResults counts alone reruns beside flaky journeys', () => {
  expect(
    summariseResults({
      results: [result({ contended: true }), result({ resultClass: 'FLAKY' })],
      skipped: 1,
    }).text
  ).toBe(
    '1 passed (1 after an alone rerun), 1 flaky, 0 failed of 2 journeys, 1 deprecated skipped'
  );
});
