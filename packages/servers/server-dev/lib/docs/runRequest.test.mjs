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

import { jest } from '@jest/globals';

// runRequest reads build artifacts, builds a Lowdefy context and calls
// callRequest - all three only exist in a running server directory, so mock
// them and leave only runRequest's own validation and pass-through under test.
const mockCallRequest = jest.fn();
const mockReadBuildArtifact = jest.fn();
const mockIsWriteRequestsAllowed = jest.fn();
const mockCreateLowdefyContext = jest.fn();
const mockLoggerInfo = jest.fn();
const mockHandleError = jest.fn();
const mockGetDevUsers = jest.fn();

jest.unstable_mockModule('@lowdefy/api', () => ({
  callRequest: mockCallRequest,
}));
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: mockReadBuildArtifact,
}));
jest.unstable_mockModule('./isWriteRequestsAllowed.js', () => ({
  default: mockIsWriteRequestsAllowed,
}));
jest.unstable_mockModule('../server/createLowdefyContext.js', () => ({
  default: mockCreateLowdefyContext,
}));
jest.unstable_mockModule('../server/auth/getDevUsers.js', () => ({
  default: mockGetDevUsers,
}));

const { ConfigError } = await import('@lowdefy/errors');
const { clearMocks, loadMocks } = await import('./devMockRegistry.js');
const { default: runRequest } = await import('./runRequest.js');

const honoContext = { req: { path: '/lowdefy-docs/run-request' } };

afterEach(() => {
  clearMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockReadBuildArtifact.mockImplementation(({ name }) => {
    if (name === 'plugins/requestSchemas.json') {
      return { MongoDBFind: { meta: { checkRead: true, checkWrite: false } } };
    }
    return { type: 'MongoDBFind' };
  });
  mockIsWriteRequestsAllowed.mockResolvedValue(false);
  mockCreateLowdefyContext.mockResolvedValue({
    logger: { info: mockLoggerInfo },
    handleError: mockHandleError,
  });
  mockCallRequest.mockResolvedValue({ id: 'requests', response: [{ _id: 1 }] });
  mockGetDevUsers.mockReturnValue({ admin: { id: 'dev-admin', roles: ['admin'] } });
});

test('runRequest passes a user object to createLowdefyContext', async () => {
  const user = { roles: ['admin'], organization_id: 'org_1' };

  const result = await runRequest({
    pageId: 'home',
    requestId: 'get_rows',
    user,
    honoContext,
  });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user });
  expect(result.refused).toBe(false);
  expect(result.response).toEqual([{ _id: 1 }]);
});

test('runRequest logs the resolved caller it ran the request as, not the raw argument', async () => {
  mockCreateLowdefyContext.mockResolvedValue({
    logger: { info: mockLoggerInfo },
    handleError: mockHandleError,
    user: { id: 'dev-admin', roles: ['admin'], email: 'a@b.c' },
  });

  await runRequest({ pageId: 'home', requestId: 'get_rows', user: 'admin', honoContext });

  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_run_request',
    pageId: 'home',
    requestId: 'get_rows',
    user: { id: 'dev-admin', roles: ['admin'] },
  });
});

test('runRequest resolves a dev user fixture name to the declared caller', async () => {
  await runRequest({ pageId: 'home', requestId: 'get_rows', user: 'admin', honoContext });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({
    c: honoContext,
    user: { id: 'dev-admin', roles: ['admin'] },
  });
});

test('runRequest throws a ConfigError when the dev user name is not declared', async () => {
  await expect(
    runRequest({ pageId: 'home', requestId: 'get_rows', user: 'adin', honoContext })
  ).rejects.toThrow(ConfigError);
  await expect(
    runRequest({ pageId: 'home', requestId: 'get_rows', user: 'adin', honoContext })
  ).rejects.toThrow(/Unknown dev user "adin"/);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runRequest throws a ConfigError when user is neither a name nor an object', async () => {
  await expect(
    runRequest({ pageId: 'home', requestId: 'get_rows', user: ['admin'], honoContext })
  ).rejects.toThrow(/must be a dev user name or an object/);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runRequest builds a context with an undefined user when user is omitted', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user: undefined });
  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_run_request',
    pageId: 'home',
    requestId: 'get_rows',
    user: { id: null, roles: [] },
  });
  expect(result).toEqual({ refused: false, id: 'requests', response: [{ _id: 1 }] });
});

test('runRequest refuses a write request for an impersonated caller too', async () => {
  mockReadBuildArtifact.mockImplementation(({ name }) => {
    if (name === 'plugins/requestSchemas.json') {
      return { MongoDBInsertOne: { meta: { checkWrite: true } } };
    }
    return { type: 'MongoDBInsertOne' };
  });

  const result = await runRequest({
    pageId: 'home',
    requestId: 'insert_row',
    user: { roles: ['admin'] },
    honoContext,
  });

  expect(result.refused).toBe(true);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runRequest without explain passes no trace and returns no explain key', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(mockCallRequest.mock.calls[0][1].trace).toBeUndefined();
  expect(result).not.toHaveProperty('explain');
});

test('runRequest with explain: false returns no explain key', async () => {
  const result = await runRequest({
    pageId: 'home',
    requestId: 'get_rows',
    explain: false,
    honoContext,
  });

  expect(mockCallRequest.mock.calls[0][1].trace).toBeUndefined();
  expect(result).not.toHaveProperty('explain');
});

test('runRequest with explain: true returns the five explain fields and a caller with only id, organization_id and roles', async () => {
  mockCreateLowdefyContext.mockResolvedValue({
    logger: { info: mockLoggerInfo },
    user: {
      id: 'u_1',
      organization_id: 'org_1',
      roles: ['admin'],
      email: 'a@b.c',
      session: { token: 'secret' },
    },
  });
  mockCallRequest.mockImplementation(async (context, { trace }) => {
    trace.connection = {
      id: 'app_data',
      type: 'MongoDBCollection',
      tenant: { field: 'organization_id', value: 'org_1' },
    };
    trace.properties = { query: { status: 'open' } };
    trace.effective = {
      query: { $and: [{ status: 'open' }, { organization_id: 'org_1' }] },
      options: undefined,
    };
    trace.rewritten.push({ at: 'query', injected: { organization_id: 'org_1' } });
    return { id: 'requests', response: [] };
  });

  const result = await runRequest({
    pageId: 'home',
    requestId: 'get_rows',
    explain: true,
    honoContext,
  });

  expect(mockCallRequest.mock.calls[0][1].trace).toEqual(
    expect.objectContaining({ rewritten: expect.any(Array) })
  );
  expect(result.response).toEqual([]);
  expect(Object.keys(result.explain).sort()).toEqual([
    'caller',
    'connection',
    'effective',
    'properties',
    'rewritten',
  ]);
  expect(result.explain).toEqual({
    caller: { id: 'u_1', organization_id: 'org_1', roles: ['admin'] },
    connection: {
      id: 'app_data',
      type: 'MongoDBCollection',
      tenant: { field: 'organization_id', value: 'org_1' },
    },
    properties: { query: { status: 'open' } },
    effective: {
      query: { $and: [{ status: 'open' }, { organization_id: 'org_1' }] },
      options: undefined,
    },
    rewritten: [{ at: 'query', injected: { organization_id: 'org_1' } }],
  });
});

test('runRequest with explain: true reports effective: null and a note when the resolver sets nothing', async () => {
  mockCallRequest.mockImplementation(async (context, { trace }) => {
    trace.connection = { id: 'api', type: 'AxiosHttp', tenant: null };
    trace.properties = { url: '/x' };
    return { id: 'requests', response: {} };
  });

  const result = await runRequest({
    pageId: 'home',
    requestId: 'get_rows',
    explain: true,
    honoContext,
  });

  expect(result.explain.effective).toBe(null);
  expect(result.explain.note).toBe(
    'The request did not reach the driver — it failed before the resolver ran, so there is no effective query.'
  );
  expect(result.explain.caller).toEqual({ id: null, organization_id: null, roles: [] });
});

test('runRequest with explain: true keeps the trace collected before a request error', async () => {
  mockCallRequest.mockImplementation(async (context, { trace }) => {
    trace.connection = { id: 'app_data', type: 'MongoDBCollection', tenant: null };
    throw new Error('boom');
  });

  const result = await runRequest({
    pageId: 'home',
    requestId: 'get_rows',
    explain: true,
    honoContext,
  });

  expect(result.error).toEqual({
    name: 'Error',
    message: 'boom',
    source: null,
    configKey: null,
  });
  expect(result.explain.connection).toEqual({
    id: 'app_data',
    type: 'MongoDBCollection',
    tenant: null,
  });
  expect(result.explain.effective).toBe(null);
});

test('runRequest hands a fault to context.handleError and reports its resolved source', async () => {
  const fault = new Error('Connection "app_data" does not exist.');
  fault.name = 'RequestError';
  fault.configKey = 'request.7';
  // handleError is the server's error sink: it resolves the config source onto
  // the error and records it in serverErrorStore, which is what puts the
  // failure under serverErrors in build_status.
  mockHandleError.mockImplementation(async (error) => {
    error.source = 'pages/home.yaml:12';
  });
  mockCallRequest.mockRejectedValue(fault);

  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(mockHandleError).toHaveBeenCalledWith(fault);
  expect(result).toEqual({
    refused: false,
    error: {
      name: 'RequestError',
      message: 'Connection "app_data" does not exist.',
      source: 'pages/home.yaml:12',
      configKey: 'request.7',
    },
  });
});

test('runRequest returns a successful run whose response is undefined', async () => {
  mockCallRequest.mockResolvedValue({ id: 'requests', response: undefined });

  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(result).toEqual({ refused: false, id: 'requests', response: undefined });
});

// run_request always calls the real connection, so when a loaded checkpoint is
// replaying the same request the page and this result disagree — the agent has
// to be told, or it will read this result as what the page is showing.
test('runRequest reports mockedElsewhere when a loaded checkpoint replays the same request', async () => {
  loadMocks({
    pageId: 'home',
    checkpoint: 'broken-refund',
    mocks: { get_rows: { response: { rows: [] } } },
  });

  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(result.mockedElsewhere).toEqual({ checkpoint: 'broken-refund' });
  // The tool still ran the real request - it does not replay.
  expect(mockCallRequest).toHaveBeenCalled();
  expect(result.response).toEqual([{ _id: 1 }]);
});

test('runRequest omits mockedElsewhere when no checkpoint is replaying the request', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(result.mockedElsewhere).toBeUndefined();
});
