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

import withAppErrors from './withAppErrors.js';

const findings = [
  {
    kind: 'server-error',
    severity: 'error',
    message: 'Unrecognized pipeline stage',
    pageId: 'orders',
    source: 'pages/orders.yaml:12',
    configKey: null,
    key: 'server-error|orders|pages/orders.yaml:12',
  },
  {
    kind: 'client-error',
    severity: 'error',
    message: 'Boom',
    pageId: 'orders',
    source: null,
    configKey: null,
    key: 'client-error|orders|message:abcd1234',
  },
];

test('withAppErrors fails a step that passed with the app errors its window held', () => {
  expect(withAppErrors({ findings, index: 2, step: { click: 'save' } })).toEqual({
    index: 2,
    step: { click: 'save' },
    kind: 'app-error',
    message:
      'Step 2 (click) caused 2 app errors: server-error: Unrecognized pipeline stage; client-error: Boom',
    expected: 'no app error',
    actual: ['server-error: Unrecognized pipeline stage', 'client-error: Boom'],
    errors: [
      {
        kind: 'server-error',
        message: 'Unrecognized pipeline stage',
        source: 'pages/orders.yaml:12',
        configKey: null,
        key: 'server-error|orders|pages/orders.yaml:12',
      },
      {
        kind: 'client-error',
        message: 'Boom',
        source: null,
        configKey: null,
        key: 'client-error|orders|message:abcd1234',
      },
    ],
  });
});

test('withAppErrors leads with the app error when the step also failed on its own', () => {
  const failure = withAppErrors({
    failure: { index: 0, step: { click: 'save' }, message: 'Expected text "Saved".' },
    findings: [findings[0]],
    index: 0,
    step: { click: 'save' },
  });
  expect(failure.kind).toBe('app-error');
  expect(failure.stepMessage).toBe('Expected text "Saved".');
  expect(failure.message).toBe(
    'Step 0 (click) caused an app error: server-error: Unrecognized pipeline stage. The step also failed: Expected text "Saved".'
  );
});

test('withAppErrors keeps a left-origin failure and adds the app errors beside it', () => {
  const leftOrigin = {
    index: 1,
    step: { as: 'outsider' },
    expected: 'every request to stay on http://localhost:3227',
    actual: 'http://127.0.0.1:3227/api/root',
    message: 'Journey left its origin.',
  };
  const failure = withAppErrors({
    failure: leftOrigin,
    leftOrigin: true,
    findings: [findings[0]],
    index: 1,
    step: { as: 'outsider' },
  });
  expect(failure).toEqual({
    ...leftOrigin,
    errors: [expect.objectContaining({ kind: 'server-error' })],
  });
});
