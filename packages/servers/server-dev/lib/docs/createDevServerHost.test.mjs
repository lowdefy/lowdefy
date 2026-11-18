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

import { beforeEach, expect, test, vi } from 'vitest';

// The dev server host's fault list: what a call logs at error level is listed on its answer, and
// one a :catch of the routine handled is marked caught, as createFaultSink in @lowdefy/test-utils
// marks it on the build host. The routine is stood in for by the @lowdefy/api calls, which log
// through context.handleError as runRoutine does.

const mockHandleError = vi.fn(async () => {});
vi.doMock('../server/createLowdefyContext.js', () => ({
  default: vi.fn(async () => ({ handleError: mockHandleError, rid: 'rid_1' })),
}));
const mockCallEndpoint = vi.fn();
const mockRunWebhookEndpoint = vi.fn();
vi.doMock('@lowdefy/api', () => ({
  callEndpoint: mockCallEndpoint,
  callRequest: vi.fn(),
  getPageConfig: vi.fn(),
  getRootConfig: vi.fn(async () => ({})),
  parseRequestBody: ({ text }) => JSON.parse(text),
  redactErrorResponse: (context, error) => ({ name: error.name, message: error.message }),
  runDetachedEndpoint: vi.fn(),
  runWebhookEndpoint: mockRunWebhookEndpoint,
}));
vi.doMock('@lowdefy/journey-headless', () => ({
  createHeadlessHost: (host) => host,
  loadClientPlugins: vi.fn(),
}));
vi.doMock('@lowdefy/test-utils/dataSets', () => ({ findSessionDocuments: vi.fn() }));
vi.doMock('../server/jitPageBuilder.js', () => ({ default: vi.fn() }));
vi.doMock('./readBuildArtifact.js', () => ({ default: vi.fn() }));
vi.doMock('../server/auth/resolveHeadlessUser.js', () => ({ default: vi.fn() }));

const { default: createDevServerHost } = await import('./createDevServerHost.js');

function createHost() {
  return createDevServerHost({
    counter: { recordCall: vi.fn() },
    origin: 'http://localhost:3227',
  });
}

// A routine that logs a fault its :catch handled, then one that escaped it.
async function logFaults(context) {
  const caught = new Error('Caught on purpose');
  const escaped = new Error('Escaped on purpose');
  await context.handleError(caught, { caught: true });
  await context.handleError(escaped, { caught: false });
  return { caught, escaped };
}

beforeEach(() => {
  mockHandleError.mockClear();
  mockCallEndpoint.mockReset();
  mockRunWebhookEndpoint.mockReset();
});

test('the dev server host marks a fault a :catch handled caught on a webhook answer', async () => {
  let logged;
  mockRunWebhookEndpoint.mockImplementation(async (context) => {
    logged = await logFaults(context);
    return { status: 200, body: { received: true } };
  });
  const host = await createHost();
  const answer = await host.webhook({
    endpointId: 'caught_webhook',
    headers: {},
    query: {},
    rawBody: '{}',
  });
  expect(answer.status).toBe(200);
  expect(answer.body).toEqual({ received: true });
  expect(answer.faults).toEqual([logged.caught, logged.escaped]);
  expect(answer.faults.map(({ caught }) => caught)).toEqual([true, undefined]);
  // The server's own handler still logs both, with the options the routine passed.
  expect(mockHandleError.mock.calls).toEqual([
    [logged.caught, { caught: true }],
    [logged.escaped, { caught: false }],
  ]);
});

test('the dev server host marks a fault a :catch handled caught on a call answer', async () => {
  mockCallEndpoint.mockImplementation(async (context) => {
    await logFaults(context);
    return { success: true, response: { ok: true } };
  });
  const host = await createHost();
  const answer = await host.call({ endpointId: 'caught_detached', kind: 'endpoint', payload: {} });
  expect(answer.status).toBe(200);
  expect(answer.response).toEqual({ ok: true });
  expect(answer.faults.map(({ caught, message }) => ({ caught, message }))).toEqual([
    { caught: true, message: 'Caught on purpose' },
    { caught: undefined, message: 'Escaped on purpose' },
  ]);
});
