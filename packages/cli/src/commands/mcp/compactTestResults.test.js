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

import compactTestResults from './compactTestResults.js';
import { expect, test } from 'vitest';

function passing(index) {
  return {
    name: `journey ${index}`,
    filePath: `tests/journeys/journey-${index}.yaml`,
    passed: true,
    class: 'PASS',
    report: `PASS  journey ${index}  (12 steps, 3400ms)`,
  };
}

function failing(index, message = 'refund is hidden') {
  return {
    name: `journey ${index}`,
    filePath: `tests/journeys/journey-${index}.yaml`,
    passed: false,
    class: 'FAIL',
    message,
    failure: { index: 0, step: { expect: { visible: 'refund' } }, message },
    report: `FAIL  journey ${index}\n      ${message}`,
  };
}

function printed(answer) {
  return JSON.stringify(
    { app: 'apps/demo', url: 'http://localhost:4100', summary: 'summary', ...answer },
    null,
    2
  );
}

test('compactTestResults gives failures in full, passing journeys as their PASS line, and skipped lines', () => {
  const failure = failing(2);

  const answer = compactTestResults({
    results: [passing(1), failure, passing(3)],
    skipped: [{ name: 'old', skipped: 'deprecated', report: 'SKIP  old  (deprecated)' }],
  });

  expect(answer).toEqual({
    failed: [failure],
    passed: ['PASS  journey 1  (12 steps, 3400ms)', 'PASS  journey 3  (12 steps, 3400ms)'],
    skipped: ['SKIP  old  (deprecated)'],
  });
});

test('compactTestResults counts a flaky journey as failed', () => {
  const flaky = { ...failing(1), class: 'FLAKY' };

  const answer = compactTestResults({ results: [flaky], skipped: [] });

  expect(answer.failed).toEqual([flaky]);
  expect(answer.passed).toEqual([]);
});

test('compactTestResults keeps 1,000 failing journeys with long messages under 25,000 characters', () => {
  const message = 'x'.repeat(1000);
  const results = Array.from({ length: 1000 }, (_, index) => failing(index, message));

  const answer = compactTestResults({ results, skipped: [] });

  expect(printed(answer).length).toBeLessThan(25000);
  // The first failures are whole, the next are named with a cut message, and
  // the count of the rest is given.
  expect(answer.failed[0]).toEqual(results[0]);
  const brief = answer.failed[answer.failed.length - 1];
  expect(brief).toEqual({
    name: brief.name,
    filePath: brief.filePath,
    class: 'FAIL',
    message: `${'x'.repeat(300)}...`,
  });
  expect(answer.omitted.failedDetail).toBeGreaterThan(0);
  expect(answer.omitted.failed).toBeGreaterThan(0);
  const whole = answer.failed.length - answer.omitted.failedDetail;
  expect(whole + answer.omitted.failedDetail + answer.omitted.failed).toEqual(1000);
});

test('compactTestResults keeps 5,000 passing journeys under 25,000 characters and counts the lines left out', () => {
  const results = Array.from({ length: 5000 }, (_, index) => passing(index));

  const answer = compactTestResults({ results, skipped: [] });

  expect(printed(answer).length).toBeLessThan(25000);
  expect(answer.failed).toEqual([]);
  expect(answer.passed.length).toBeGreaterThan(100);
  expect(answer.passed.length + answer.omitted.passed).toEqual(5000);
});

test('compactTestResults names every failure before it spends room on passing lines', () => {
  const results = [
    ...Array.from({ length: 2000 }, (_, index) => passing(index)),
    ...Array.from({ length: 30 }, (_, index) => failing(2000 + index, 'y'.repeat(2000))),
  ];

  const answer = compactTestResults({ results, skipped: [] });

  expect(printed(answer).length).toBeLessThan(25000);
  expect(answer.failed).toHaveLength(30);
  expect(answer.omitted.failed).toBeUndefined();
});

test('compactTestResults leaves omitted out when everything fits', () => {
  const answer = compactTestResults({ results: [passing(1)], skipped: [] });

  expect(answer.omitted).toBeUndefined();
});
