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

const failure = {
  index: 4,
  step: { click: 'close_submit' },
  expected: 'close_submit to be clickable',
  actual: 'hidden',
  message: 'close_submit is hidden',
};

test('formatJourneyResult prints a replayed PASS with the runs and the mean duration', () => {
  expect(
    formatJourneyResult({
      result: {
        name: 'member assigns an open ticket',
        passed: true,
        class: 'PASS',
        repeat: 3,
        runs: 3,
        passedRuns: 3,
        failures: [],
        stepCount: 5,
        durationMs: 2100,
      },
    })
  ).toEqual(['PASS   member assigns an open ticket   (5 steps, 3/3, 2.1s each)']);
});

test('formatJourneyResult prints a FLAKY journey with each failing run', () => {
  expect(
    formatJourneyResult({
      result: {
        name: 'owner closes a ticket',
        filePath: '/app/tests/journeys/close.yaml',
        passed: false,
        class: 'FLAKY',
        repeat: 4,
        runs: 4,
        passedRuns: 2,
        failures: [
          { run: 2, step: 4, message: 'close_submit is hidden' },
          { run: 4, step: 1, message: 'list is empty' },
        ],
        failure,
        message: failure.message,
        stepCount: 5,
        durationMs: 2000,
      },
    })
  ).toEqual([
    'FLAKY  owner closes a ticket   (2/4 passed) run 2 failed at step 4 (click "close_submit"): close_submit is hidden',
    '      file: /app/tests/journeys/close.yaml',
    '      step 4: { click: close_submit }',
    '      expected: close_submit to be clickable',
    '      actual:   hidden',
    '      close_submit is hidden',
    '      run 4 failed at step 1: list is empty',
  ]);
});

test('formatJourneyResult prints a FAIL of every run as a finding', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'admin bulk-imports contacts',
      filePath: '/app/tests/journeys/import.yaml',
      passed: false,
      class: 'FAIL',
      repeat: 3,
      runs: 3,
      passedRuns: 0,
      failures: [1, 2, 3].map((run) => ({ run, step: 4, message: failure.message })),
      failure,
      message: failure.message,
      stepCount: 5,
      durationMs: 1000,
    },
  });
  expect(lines[0]).toEqual(
    'FAIL   admin bulk-imports contacts   (0/3) step 4 (click "close_submit"): close_submit is hidden — fails every run: a finding, not a test to fix by retrying'
  );
});

const evidence = {
  production: {
    sessions: 412,
    persons: 37,
    orgs: 9,
    share: 0.31,
    failures: 14,
    window: '2026-09-03/2026-10-02',
  },
  mutation: { killed: 11, total: 12 },
};

test('formatJourneyResult appends evidence to the PASS line', () => {
  expect(
    formatJourneyResult({
      result: {
        name: 'member assigns an open ticket to a teammate',
        passed: true,
        stepCount: 5,
        durationMs: 2100,
        evidence,
      },
    })
  ).toEqual([
    'PASS  member assigns an open ticket to a teammate  (5 steps, 2100ms)  412 sessions · 9 orgs · 11/12 mutants',
  ]);
});

test('formatJourneyResult puts no evidence on a FAIL line', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'broken',
      filePath: '/app/tests/journeys/broken.yaml',
      passed: false,
      message: 'refund is hidden',
      evidence,
    },
  });
  expect(lines.join('\n')).not.toContain('sessions');
});

const appErrorFailure = {
  index: 1,
  step: { click: 'save' },
  kind: 'app-error',
  message: 'Step 1 (click) caused an app error: server-error: Unrecognized pipeline stage',
  expected: 'no app error',
  actual: ['server-error: Unrecognized pipeline stage'],
  errors: [
    {
      kind: 'server-error',
      message: 'Unrecognized pipeline stage',
      source: 'pages/tickets.yaml:42',
      configKey: null,
      key: 'server-error|tickets|pages/tickets.yaml:42',
    },
    {
      kind: 'client-error',
      message: 'Boom',
      source: null,
      configKey: null,
      key: 'client-error|tickets|message:abcd1234',
    },
  ],
};

test('formatJourneyResult prints an app error failure as the step and one line per error', () => {
  expect(
    formatJourneyResult({
      result: {
        name: 'saves a ticket',
        filePath: '/app/tests/journeys/save.yaml',
        passed: false,
        failure: appErrorFailure,
        message: appErrorFailure.message,
      },
    })
  ).toEqual([
    'FAIL  saves a ticket',
    '      file: /app/tests/journeys/save.yaml',
    '      step 1: { click: save }',
    '      server-error  Unrecognized pipeline stage  pages/tickets.yaml:42',
    '      client-error  Boom',
  ]);
});

test('formatJourneyResult prints what the step found when it failed beside an app error', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'saves a ticket',
      filePath: '/app/tests/journeys/save.yaml',
      passed: false,
      failure: {
        ...appErrorFailure,
        errors: [appErrorFailure.errors[0]],
        stepMessage: 'save is hidden',
      },
    },
  });
  expect(lines.slice(2)).toEqual([
    '      step 1: { click: save }',
    '      server-error  Unrecognized pipeline stage  pages/tickets.yaml:42',
    '      save is hidden',
  ]);
});

test('formatJourneyResult prints an app error raised while the page opened as on open', () => {
  const failure = {
    phase: 'open',
    kind: 'app-error',
    message: 'Opening the page caused an app error: server-error: onInit failed',
    expected: 'no app error',
    actual: ['server-error: onInit failed'],
    errors: [{ kind: 'server-error', message: 'onInit failed', source: 'pages/home.yaml:7' }],
  };
  expect(
    formatJourneyResult({
      result: {
        name: 'opens home',
        filePath: '/app/tests/journeys/home.yaml',
        passed: false,
        failure,
      },
    })
  ).toEqual([
    'FAIL  opens home',
    '      file: /app/tests/journeys/home.yaml',
    '      on open',
    '      server-error  onInit failed  pages/home.yaml:7',
  ]);
  const repeated = formatJourneyResult({
    result: {
      name: 'opens home',
      filePath: '/app/tests/journeys/home.yaml',
      passed: false,
      class: 'FLAKY',
      repeat: 3,
      runs: 3,
      passedRuns: 1,
      failures: [
        { run: 1, step: null, phase: 'open', message: failure.message },
        { run: 3, step: null, phase: 'open', message: failure.message },
      ],
      failure,
      message: failure.message,
    },
  });
  expect(repeated[0]).toEqual(
    'FLAKY  opens home   (1/3 passed) run 1 failed on open: Opening the page caused an app error: server-error: onInit failed'
  );
  expect(repeated.at(-1)).toEqual(
    '      run 3 failed on open: Opening the page caused an app error: server-error: onInit failed'
  );
});

test('formatJourneyResult lists the app errors beside a left-origin failure', () => {
  const lines = formatJourneyResult({
    result: {
      name: 'switches actor',
      filePath: '/app/tests/journeys/switch.yaml',
      passed: false,
      failure: {
        index: 0,
        step: { as: 'outsider' },
        expected: 'every request to stay on http://localhost:3000',
        actual: 'http://127.0.0.1:3000/api/root',
        message: 'Journey left its origin.',
        errors: [appErrorFailure.errors[0]],
      },
    },
  });
  expect(lines.at(-1)).toEqual(
    '      server-error  Unrecognized pipeline stage  pages/tickets.yaml:42'
  );
});
