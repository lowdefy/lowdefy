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

import evaluateInvariants from './evaluateInvariants.js';

const origin = 'http://localhost:3111';

function quietWindow(overrides = {}) {
  return {
    urlBefore: `${origin}/tickets`,
    urlAfter: `${origin}/tickets`,
    emits: [],
    mutationCount: 0,
    pageErrors: [],
    requests: [],
    responses: [],
    errors: [],
    ...overrides,
  };
}

function evaluate({
  step = { click: { blockId: 'assign_button' } },
  result,
  window,
  search = false,
}) {
  return evaluateInvariants({
    step,
    result: result ?? { status: 'ok' },
    window,
    pageId: 'tickets',
    usesSearchStage: () => search,
    resolveSource: async (configKey) => (configKey === 'k1' ? 'pages/tickets.yaml:88' : null),
  });
}

function failedEmit(errorName, extra = {}) {
  return {
    blockId: 'assign_button',
    eventName: 'onClick',
    success: false,
    failure: { actionId: 'assign', actionType: 'CallAPI', configKey: 'k1', errorName, ...extra },
  };
}

test('a failed event with an error that is not a UserError is an action-error located through its config key', async () => {
  const findings = await evaluate({
    window: quietWindow({ emits: [failedEmit('RequestError')], mutationCount: 3 }),
  });
  expect(findings).toEqual([
    {
      kind: 'action-error',
      severity: 'error',
      message: 'CallAPI "assign" failed in assign_button.onClick with RequestError.',
      pageId: 'tickets',
      source: 'pages/tickets.yaml:88',
      configKey: 'k1',
      key: 'action-error|tickets|pages/tickets.yaml:88',
    },
  ]);
});

test('a failed Validate (a UserError) is not a finding, and its click is not dead', async () => {
  const findings = await evaluate({
    window: quietWindow({ emits: [failedEmit('UserError', { actionType: 'Validate' })] }),
  });
  expect(findings).toEqual([]);
});

test('client error entries and uncaught page errors are client-errors; a page error the entry already reports is not repeated', async () => {
  const findings = await evaluate({
    window: quietWindow({
      mutationCount: 1,
      errors: [
        {
          store: 'client',
          name: 'OperatorError',
          message: 'Explorer boom',
          source: 'pages/tickets.yaml:12',
        },
      ],
      pageErrors: [
        { name: 'Error', message: 'Explorer boom' },
        { name: 'TypeError', message: 'x is undefined' },
      ],
    }),
  });
  expect(findings.map(({ kind, message, source }) => [kind, message, source])).toEqual([
    ['client-error', 'Explorer boom', 'pages/tickets.yaml:12'],
    ['client-error', 'TypeError: x is undefined', null],
  ]);
});

test('a window with an environment finding reports only that, not the failed action or 5xx it caused', async () => {
  const response = { url: `${origin}/api/request/tickets/search`, method: 'POST', status: 500 };
  const findings = await evaluate({
    search: true,
    window: quietWindow({
      emits: [failedEmit('ServiceError', { actionType: 'Request' })],
      requests: [response],
      responses: [response],
      errors: [{ store: 'server', message: 'Atlas only', pageId: 'other', requestId: 'x' }],
    }),
  });
  expect(findings.map((finding) => finding.kind)).toEqual(['environment']);
});

test('an absolute source is made relative to the config directory', async () => {
  const findings = await evaluateInvariants({
    step: { click: { blockId: 'a' } },
    result: { status: 'ok' },
    window: quietWindow({
      mutationCount: 1,
      errors: [{ store: 'server', message: 'Boom', source: '/apps/crm/pages/tickets.yaml:30' }],
    }),
    pageId: 'tickets',
    configDirectory: '/apps/crm',
    usesSearchStage: () => false,
    resolveSource: async () => null,
  });
  expect(findings[0].source).toBe('pages/tickets.yaml:30');
  expect(findings[0].key).toBe('server-error|tickets|pages/tickets.yaml:30');
});

test('a server error entry is a server-error, or environment when its request uses a search stage', async () => {
  const window = quietWindow({
    mutationCount: 1,
    errors: [{ store: 'server', message: 'Unrecognized stage', source: 'pages/tickets.yaml:30' }],
  });
  expect((await evaluate({ window })).map((finding) => [finding.kind, finding.severity])).toEqual([
    ['server-error', 'error'],
  ]);
  expect(
    (await evaluate({ window, search: true })).map((finding) => [finding.kind, finding.severity])
  ).toEqual([['environment', 'info']]);
});

test('a 5xx from an app route is request-failed unless a server error entry for that request explains it', async () => {
  const response = {
    url: `${origin}/api/endpoints/assign_ticket`,
    method: 'POST',
    status: 500,
  };
  const unexplained = await evaluate({
    window: quietWindow({ requests: [response], responses: [response] }),
  });
  expect(unexplained).toEqual([
    expect.objectContaining({
      kind: 'request-failed',
      message: 'POST /api/endpoints/assign_ticket answered 500.',
    }),
  ]);
  const explained = await evaluate({
    window: quietWindow({
      requests: [response],
      responses: [response],
      errors: [{ store: 'server', message: 'Boom', endpointId: 'assign_ticket', source: null }],
    }),
  });
  expect(explained.map((finding) => finding.kind)).toEqual(['server-error']);
  const request = {
    url: `${origin}/api/request/tickets/close_ticket`,
    method: 'POST',
    status: 502,
  };
  const explainedRequest = await evaluate({
    window: quietWindow({
      requests: [request],
      responses: [request],
      errors: [{ store: 'server', message: 'Down', pageId: 'tickets', requestId: 'close_ticket' }],
    }),
  });
  expect(explainedRequest.map((finding) => finding.kind)).toEqual(['server-error']);
});

test('a successful click with no event, no lasting mutation, no app request and no URL change is a dead-click warning', async () => {
  const findings = await evaluate({ window: quietWindow() });
  expect(findings).toEqual([
    expect.objectContaining({
      kind: 'dead-click',
      severity: 'warning',
      message:
        'Clicking assign_button did nothing: no event ran, the page did not change and no request was sent.',
    }),
  ]);
});

test('a click is not dead when an event ran, the DOM changed, a request went out, the URL changed, the document was replaced or the step failed', async () => {
  const lively = [
    quietWindow({ emits: [{ blockId: 'a', eventName: 'onClick', success: true }] }),
    quietWindow({ mutationCount: 1 }),
    quietWindow({ requests: [{ url: `${origin}/api/request/tickets/x` }] }),
    quietWindow({ urlAfter: `${origin}/ticket` }),
    quietWindow({ mutationCount: null }),
  ];
  for (const window of lively) {
    expect(await evaluate({ window })).toEqual([]);
  }
  expect(await evaluate({ window: quietWindow(), result: { status: 'failed' } })).toEqual([]);
  expect(
    await evaluate({ window: quietWindow(), step: { fill: { blockId: 'title', value: 'x' } } })
  ).toEqual([]);
});

test('findings with the same key in one window are reported once', async () => {
  const findings = await evaluate({
    window: quietWindow({
      mutationCount: 1,
      errors: [
        { store: 'server', message: 'Boom', source: 'pages/tickets.yaml:30' },
        { store: 'server', message: 'Boom again', source: 'pages/tickets.yaml:30' },
      ],
    }),
  });
  expect(findings).toHaveLength(1);
});
