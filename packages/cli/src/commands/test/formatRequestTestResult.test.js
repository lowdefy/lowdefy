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
import formatRequestTestResult from './formatRequestTestResult.js';

test('formatRequestTestResult prints one PASS line', () => {
  expect(
    formatRequestTestResult({ result: { name: 'lists controls', passed: true, durationMs: 12 } })
  ).toEqual(['PASS  lists controls  (12ms)']);
});

test('formatRequestTestResult prints the mismatch path, expected and actual', () => {
  expect(
    formatRequestTestResult({
      result: {
        name: 'lists controls',
        filePath: 'tests/requests/controls.test.yaml',
        passed: false,
        mismatch: { matched: false, path: '0.title', expected: 'Access reviews', actual: 'Other' },
      },
    })
  ).toEqual([
    'FAIL  lists controls',
    '      file: tests/requests/controls.test.yaml',
    '      at: response.0.title',
    '      expected: Access reviews',
    '      actual:   Other',
  ]);
});

test('formatRequestTestResult prints a schema mismatch at the response root with its message', () => {
  const lines = formatRequestTestResult({
    result: {
      name: 't',
      filePath: 'f',
      passed: false,
      mismatch: {
        matched: false,
        path: '',
        expected: { type: 'array', minItems: 1 },
        actual: [],
        message: 'must NOT have fewer than 1 items',
      },
    },
  });
  expect(lines).toEqual([
    'FAIL  t',
    '      file: f',
    '      at: response',
    '      expected: { type: array, minItems: 1 }',
    '      actual:   []',
    '      must NOT have fewer than 1 items',
  ]);
});

test('formatRequestTestResult prints a message-only failure', () => {
  expect(
    formatRequestTestResult({
      result: { name: 't', filePath: 'f', passed: false, message: 'Refused: nope' },
    })
  ).toEqual(['FAIL  t', '      file: f', '      Refused: nope']);
});
