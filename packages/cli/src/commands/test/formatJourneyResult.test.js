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

import formatJourneyResult from './formatJourneyResult.js';

test('formatJourneyResult prints a single PASS line with step count and duration', () => {
  expect(
    formatJourneyResult({
      result: { name: 'submits the form', passed: true, stepCount: 3, durationMs: 1234 },
    })
  ).toEqual(['PASS  submits the form  (3 steps, 1234ms)']);
});

test('formatJourneyResult prints the failing step index, compact step YAML, expected and actual', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'creates a control',
      filePath: '/app/tests/journeys/controls.yaml',
      passed: false,
      stepCount: 5,
      durationMs: 800,
      failure: {
        index: 4,
        step: { expect: { state: { path: 'controls.0.title', equals: 'Access reviews' } } },
        expected: 'Access reviews',
        actual: undefined,
        message: 'Expected state at "controls.0.title" to equal "Access reviews".',
      },
    },
  });
  expect(lines).toEqual([
    'FAIL  creates a control',
    '      file: /app/tests/journeys/controls.yaml',
    '      step 4: { expect: { state: { path: controls.0.title, equals: Access reviews } } }',
    '      expected: Access reviews',
    '      actual:   undefined',
    '      Expected state at "controls.0.title" to equal "Access reviews".',
  ]);
});

test('formatJourneyResult prints object expected and actual values as compact YAML', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'j',
      filePath: 'f.yaml',
      passed: false,
      failure: { index: 0, step: { click: 'save' }, expected: { a: 1 }, actual: [1, 2] },
    },
  });
  expect(lines).toEqual([
    'FAIL  j',
    '      file: f.yaml',
    '      step 0: { click: save }',
    '      expected: { a: 1 }',
    '      actual:   [ 1, 2 ]',
  ]);
});

test('formatJourneyResult prints the message when a journey failed without a step failure', () => {
  expect(
    formatJourneyResult({
      result: {
        name: 'broken.yaml',
        filePath: '/app/tests/journeys/broken.yaml',
        passed: false,
        message: 'Invalid journey file: Journey should have required property "steps".',
      },
    })
  ).toEqual([
    'FAIL  broken.yaml',
    '      file: /app/tests/journeys/broken.yaml',
    '      Invalid journey file: Journey should have required property "steps".',
  ]);
});

test('formatJourneyResult prints the data set line once across several journeys on one data set', () => {
  const seen = new Set();
  const data = {
    name: 'staging-sample',
    loadMs: 900,
    snapshot: { pulledAt: '2026-09-30T00:00:00.000Z', ageDays: 3, documents: 41212 },
  };
  const first = formatJourneyResult({
    result: { name: 'a', passed: true, stepCount: 1, durationMs: 10, data },
    seen,
  });
  const second = formatJourneyResult({
    result: { name: 'b', passed: true, stepCount: 1, durationMs: 10, data },
    seen,
  });
  expect(first).toEqual([
    'PASS  a  (1 steps, 10ms)',
    '      data staging-sample: snapshot 3 days old, 41,212 documents',
  ]);
  expect(second).toEqual(['PASS  b  (1 steps, 10ms)']);
});

test('formatJourneyResult prints fixtures only for a data set with no snapshot', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'a',
      filePath: 'f.yaml',
      passed: false,
      message: 'boom',
      data: { name: 'empty-org', loadMs: 20, snapshot: null },
    },
    seen: new Set(),
  });
  expect(lines).toEqual([
    'FAIL  a',
    '      data empty-org: fixtures only',
    '      file: f.yaml',
    '      boom',
  ]);
});

test('formatJourneyResult warns past 14 days with the pull command', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'a',
      passed: true,
      stepCount: 2,
      durationMs: 5,
      data: { name: 'staging-sample', snapshot: { ageDays: 15, documents: 1200 } },
    },
  });
  expect(lines).toEqual([
    'PASS  a  (2 steps, 5ms)',
    '      warning: data staging-sample: snapshot 15 days old, 1,200 documents. Run: lowdefy data pull staging-sample',
  ]);
});

test('formatJourneyResult prints each result warning once per run', () => {
  const seen = new Set();
  const warnings = [
    'Connections "a" and "b" both name collection "events" in different databases.',
  ];
  const result = { name: 'a', passed: true, stepCount: 1, durationMs: 1, warnings };
  expect(formatJourneyResult({ result, seen })).toEqual([
    'PASS  a  (1 steps, 1ms)',
    '      warning: Connections "a" and "b" both name collection "events" in different databases.',
  ]);
  expect(formatJourneyResult({ result, seen })).toEqual(['PASS  a  (1 steps, 1ms)']);
});
