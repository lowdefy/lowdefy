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

import { Hono } from 'hono';
import { jest } from '@jest/globals';

const mockCallRequest = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  callRequest: mockCallRequest,
  redactErrorResponse: jest.fn((context, error) => ({ error: error.message })),
}));

const mockBuildPageIfNeeded = jest.fn(async () => true);
jest.unstable_mockModule('../../lib/server/jitPageBuilder.js', () => ({
  default: mockBuildPageIfNeeded,
  getPageJitEnrichment: jest.fn(() => ({})),
}));

const mockGetMock = jest.fn(() => null);
const mockClaimMockLog = jest.fn(() => true);
jest.unstable_mockModule('../../lib/docs/devMockRegistry.js', () => ({
  claimMockLog: mockClaimMockLog,
  getMock: mockGetMock,
}));

const { default: requestHandler } = await import('./request.js');

const callOrder = [];

let loggerInfo;

function createApp() {
  const app = new Hono();
  loggerInfo = jest.fn();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      buildDirectory: '/build',
      configDirectory: '/config',
      logger: { debug: jest.fn(), info: loggerInfo, error: jest.fn() },
    });
    await next();
  });
  app.all('/api/request/*', requestHandler);
  return app;
}

function post(app, path, body = { actionId: 'a', blockId: 'b', payload: {} }) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  callOrder.length = 0;
  mockBuildPageIfNeeded.mockImplementation(async () => {
    callOrder.push('build');
    return true;
  });
  mockCallRequest.mockImplementation(async () => {
    callOrder.push('call');
    return { success: true, response: { ok: true } };
  });
});

afterEach(() => {
  mockCallRequest.mockReset();
  mockBuildPageIfNeeded.mockReset();
  mockGetMock.mockReset();
  mockGetMock.mockImplementation(() => null);
  mockClaimMockLog.mockReset();
  mockClaimMockLog.mockImplementation(() => true);
});

test('requestHandler builds the page JIT before calling the request', async () => {
  const res = await post(createApp(), '/api/request/dashboard/get_rows');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ success: true, response: { ok: true } });
  expect(mockBuildPageIfNeeded).toHaveBeenCalledWith({
    pageId: 'dashboard',
    buildDirectory: '/build',
    configDirectory: '/config',
  });
  expect(mockCallRequest).toHaveBeenCalledWith(
    expect.objectContaining({ buildDirectory: '/build' }),
    { blockId: 'b', pageId: 'dashboard', payload: {}, requestId: 'get_rows' }
  );
  expect(callOrder).toEqual(['build', 'call']);
});

test('requestHandler builds nested page ids as one page', async () => {
  await post(createApp(), '/api/request/user-account/login/get_session');
  expect(mockBuildPageIfNeeded).toHaveBeenCalledWith(
    expect.objectContaining({ pageId: 'user-account/login' })
  );
  expect(mockCallRequest).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ pageId: 'user-account/login', requestId: 'get_session' })
  );
});

test('requestHandler replays a dev mock without building or calling the request', async () => {
  mockGetMock.mockImplementation(() => ({ response: { rows: [1] }, checkpoint: 'broken-refund' }));
  const res = await post(createApp(), '/api/request/dashboard/get_rows');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ success: true, response: { rows: [1] } });
  expect(mockBuildPageIfNeeded).not.toHaveBeenCalled();
  expect(mockCallRequest).not.toHaveBeenCalled();
  expect(loggerInfo).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'dev_mock_request',
      pageId: 'dashboard',
      requestId: 'get_rows',
      msg: expect.stringContaining('answered from checkpoint "broken-refund"'),
    })
  );
});

// A replayed page re-fires its requests on every render; the log line is the
// developer's one signal that the page is not reaching the database, and it
// must not become noise.
test('requestHandler logs a replayed request only the first time for a pageId/requestId', async () => {
  mockGetMock.mockImplementation(() => ({ response: { rows: [1] }, checkpoint: 'broken-refund' }));
  mockClaimMockLog.mockImplementationOnce(() => true).mockImplementation(() => false);
  const app = createApp();

  await post(app, '/api/request/dashboard/get_rows');
  await post(app, '/api/request/dashboard/get_rows');

  expect(mockClaimMockLog).toHaveBeenCalledTimes(2);
  expect(mockClaimMockLog).toHaveBeenCalledWith({ pageId: 'dashboard', requestId: 'get_rows' });
  expect(loggerInfo).toHaveBeenCalledTimes(1);
});

// A GET to the request route is client-caused, so it must answer 405 rather
// than throwing into the error handler and being logged as a fault with a 500.
test('requestHandler returns 405 without building or calling the request for a non-POST method', async () => {
  const res = await createApp().request('/api/request/dashboard/get_rows');

  expect(res.status).toEqual(405);
  expect(await res.json()).toEqual({ error: 'Method not allowed.' });
  expect(mockBuildPageIfNeeded).not.toHaveBeenCalled();
  expect(mockCallRequest).not.toHaveBeenCalled();
});
