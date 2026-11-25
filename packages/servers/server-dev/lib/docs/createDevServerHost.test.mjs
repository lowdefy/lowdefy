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
  default: vi.fn(async () => ({
    handleError: mockHandleError,
    readConfigFile: async () => [{ pageId: 'later', path: 'later' }],
    rid: 'rid_1',
  })),
}));
const mockCallEndpoint = vi.fn();
const mockRunWebhookEndpoint = vi.fn();
const mockSendDetachedRequest = vi.fn();
const mockGetPageConfig = vi.fn();
vi.doMock('@lowdefy/api', () => ({
  callEndpoint: mockCallEndpoint,
  callRequest: vi.fn(),
  getPageConfig: mockGetPageConfig,
  getRootConfig: vi.fn(async () => ({})),
  parseRequestBody: ({ text }) => JSON.parse(text),
  redactErrorResponse: (context, error) => ({ name: error.name, message: error.message }),
  runDetachedEndpoint: vi.fn(),
  runWebhookEndpoint: mockRunWebhookEndpoint,
  sendDetachedRequest: mockSendDetachedRequest,
}));
vi.doMock('@lowdefy/journey-headless', () => ({
  createHeadlessHost: (host) => host,
  loadClientPlugins: vi.fn(),
}));
vi.doMock('@lowdefy/test-utils/dataSets', () => ({ findSessionDocuments: vi.fn() }));
const mockBuildContext = { jsMap: { client: {} } };
const mockBuildPageWithContext = vi.fn(async () => ({
  result: { built: true },
  buildContext: mockBuildContext,
}));
const mockGetPageJitEnrichment = vi.fn();
vi.doMock('../server/jitPageBuilder.js', () => ({
  buildPageWithContext: mockBuildPageWithContext,
  default: vi.fn(),
  getPageJitEnrichment: mockGetPageJitEnrichment,
}));
vi.doMock('./readBuildArtifact.js', () => ({ default: vi.fn() }));
vi.doMock('./readConnectionPlugins.js', () => ({ default: vi.fn(async () => ({})) }));
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
  mockSendDetachedRequest.mockReset();
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

// A detached CallApi on the dev server is sent over its own /api/detached route, as always
// (sendDetachedRequest), and listed on the answer once sent, as the build host lists the ones it
// takes, so expect.calls reads them the same on either host.
test('the dev server host sends a detached call for real and lists it on the answer', async () => {
  mockCallEndpoint.mockImplementation(async (context) => {
    context.sendDetached(context, {
      endpointId: 'detached_log',
      payload: { source: 'notify' },
      step: { stepId: 'call_detached_log' },
    });
    return { success: true, response: { notified: true } };
  });
  const host = await createHost();
  const answer = await host.call({ endpointId: 'notify', kind: 'endpoint', payload: {} });
  expect(answer.response).toEqual({ notified: true });
  expect(mockSendDetachedRequest).toHaveBeenCalledTimes(1);
  expect(mockSendDetachedRequest.mock.calls[0][1]).toMatchObject({
    endpointId: 'detached_log',
    payload: { source: 'notify' },
  });
  expect(answer.detached).toEqual([{ endpointId: 'detached_log', payload: { source: 'notify' } }]);
});

test('the dev server host lists no detached call whose send failed', async () => {
  mockSendDetachedRequest.mockImplementation(() => {
    throw new Error('CallApi with "detached: true" requires the CRON_SECRET environment variable.');
  });
  mockCallEndpoint.mockImplementation(async (context) => {
    try {
      context.sendDetached(context, { endpointId: 'detached_log', payload: {}, step: {} });
    } catch (error) {
      await context.handleError(error);
    }
    return { success: true, response: { notified: false } };
  });
  const host = await createHost();
  const answer = await host.call({ endpointId: 'notify', kind: 'endpoint', payload: {} });
  expect(answer.detached).toEqual([]);
  expect(answer.faults.map(({ message }) => message)).toEqual([
    'CallApi with "detached: true" requires the CRON_SECRET environment variable.',
  ]);
});

// A page the dev server builds on demand carries its _js as _jsEntries, as the page route folds it
// in (getPageJitEnrichment, from the context the page was built on), so a headless journey reads
// _js the client map it loaded at its first journey lacks.
test("the dev server host folds the built page's _js entries into its page config", async () => {
  mockGetPageConfig.mockResolvedValue({
    status: 'ok',
    pageConfig: { id: 'page:later', blocks: [{ properties: { title: { _js: 'h_later' } } }] },
    pageId: 'later',
    pathParams: {},
  });
  mockGetPageJitEnrichment.mockReturnValue({
    jsEntries: "export default { 'h_later': () => { return 1; } };",
  });
  const host = await createHost();
  const page = await host.readPageConfig({ pageId: 'later' });
  expect(mockBuildPageWithContext).toHaveBeenCalledWith(
    expect.objectContaining({ pageId: 'later' })
  );
  expect(mockGetPageJitEnrichment.mock.calls[0][0].buildContext).toBe(mockBuildContext);
  expect(page.pageConfig._jsEntries).toBe("export default { 'h_later': () => { return 1; } };");
});

test('the dev server host adds no _jsEntries to a page with no _js', async () => {
  mockGetPageConfig.mockResolvedValue({
    status: 'ok',
    pageConfig: { id: 'page:later', blocks: [] },
    pageId: 'later',
    pathParams: {},
  });
  mockGetPageJitEnrichment.mockReturnValue({});
  const host = await createHost();
  const page = await host.readPageConfig({ pageId: 'later' });
  expect(page.pageConfig).toEqual({ id: 'page:later', blocks: [] });
});
