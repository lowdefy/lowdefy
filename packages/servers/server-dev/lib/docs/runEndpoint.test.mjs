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

// runEndpoint reads lowdefy.yaml, builds a Lowdefy context and calls into
// @lowdefy/api - all of which only exist in a running server directory, so mock
// them and leave runEndpoint's own validation, gating and pass-through under
// test.
const mockCallEndpoint = jest.fn();
const mockReadBuildArtifact = jest.fn();
const mockIsWriteRequestsAllowed = jest.fn();
const mockCreateLowdefyContext = jest.fn();
const mockLoggerInfo = jest.fn();
const mockHandleError = jest.fn();
const mockGetDevUsers = jest.fn();

jest.unstable_mockModule('@lowdefy/api', () => ({
  callEndpoint: mockCallEndpoint,
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
const { MAX_RESPONSE_CHARS } = await import('./truncateResponse.js');
const { default: runEndpoint } = await import('./runEndpoint.js');

const honoContext = { req: { path: '/lowdefy-docs/run-endpoint' } };
const context = { logger: { info: mockLoggerInfo }, handleError: mockHandleError };

beforeEach(() => {
  jest.clearAllMocks();
  mockIsWriteRequestsAllowed.mockResolvedValue(true);
  mockCreateLowdefyContext.mockResolvedValue(context);
  mockReadBuildArtifact.mockReturnValue({ id: 'endpoint:create_order', type: 'Api' });
  mockGetDevUsers.mockReturnValue({ admin: { id: 'dev-admin', roles: ['admin'] } });
  mockCallEndpoint.mockResolvedValue({
    error: null,
    response: { orderId: 'o_1' },
    status: 'success',
    success: true,
  });
});

test('runEndpoint throws a ConfigError when endpointId is missing', async () => {
  await expect(runEndpoint({ honoContext })).rejects.toThrow(ConfigError);
  await expect(runEndpoint({ honoContext })).rejects.toThrow(
    'run_endpoint requires an "endpointId" string. Received undefined.'
  );
  expect(mockIsWriteRequestsAllowed).not.toHaveBeenCalled();
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runEndpoint throws a ConfigError when endpointId is not a string', async () => {
  await expect(runEndpoint({ endpointId: 42, honoContext })).rejects.toThrow(
    'run_endpoint requires an "endpointId" string. Received 42.'
  );
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runEndpoint resolves a dev user fixture name to the declared caller', async () => {
  mockIsWriteRequestsAllowed.mockResolvedValue(true);

  await runEndpoint({ endpointId: 'create_order', user: 'admin', honoContext });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({
    c: honoContext,
    user: { id: 'dev-admin', roles: ['admin'] },
  });
});

test('runEndpoint throws a ConfigError when the dev user name is not declared', async () => {
  await expect(
    runEndpoint({ endpointId: 'create_order', user: 'adin', honoContext })
  ).rejects.toThrow(ConfigError);
  await expect(
    runEndpoint({ endpointId: 'create_order', user: 'adin', honoContext })
  ).rejects.toThrow(/Unknown dev user "adin"/);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runEndpoint throws a ConfigError when user is neither a name nor an object', async () => {
  await expect(
    runEndpoint({ endpointId: 'create_order', user: ['admin'], honoContext })
  ).rejects.toThrow(/must be a dev user name or an object/);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runEndpoint refuses every endpoint when agent write access is disabled', async () => {
  mockIsWriteRequestsAllowed.mockResolvedValue(false);

  const result = await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(result).toEqual({
    refused: true,
    reason:
      'Api endpoint routines are not classified read-only — a routine can write, call other endpoints and send notifications — so running one needs agent write access.',
    howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
  });
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
  expect(mockReadBuildArtifact).not.toHaveBeenCalled();
  expect(mockCallEndpoint).not.toHaveBeenCalled();
});

test('runEndpoint refuses a write-gated endpoint for an impersonated caller too', async () => {
  mockIsWriteRequestsAllowed.mockResolvedValue(false);

  const result = await runEndpoint({
    endpointId: 'create_order',
    user: { roles: ['admin'] },
    honoContext,
  });

  expect(result.refused).toBe(true);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runEndpoint returns a not-found refusal without building a context when the endpoint does not exist', async () => {
  mockReadBuildArtifact.mockReturnValue(null);

  const result = await runEndpoint({ endpointId: 'missing_endpoint', honoContext });

  expect(result).toEqual({
    refused: true,
    reason:
      'Endpoint "missing_endpoint" was not found. See GET /lowdefy-docs/app-map for the endpoints that exist.',
  });
  expect(mockReadBuildArtifact).toHaveBeenCalledWith({ name: 'api/missing_endpoint.json' });
  // A typo'd id costs an artifact read, not a context construction.
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
  expect(mockCallEndpoint).not.toHaveBeenCalled();
  expect(mockLoggerInfo).not.toHaveBeenCalled();
});

test('runEndpoint runs a successful routine and returns its result', async () => {
  const result = await runEndpoint({
    endpointId: 'create_order',
    payload: { sku: 'A1' },
    honoContext,
  });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user: undefined });
  expect(mockCallEndpoint).toHaveBeenCalledWith(context, {
    blockId: undefined,
    endpointId: 'create_order',
    pageId: undefined,
    payload: { sku: 'A1' },
  });
  expect(result).toEqual({
    refused: false,
    error: null,
    response: { orderId: 'o_1' },
    status: 'success',
    success: true,
  });
});

test('runEndpoint defaults the payload to an empty object', async () => {
  await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(mockCallEndpoint).toHaveBeenCalledWith(context, expect.objectContaining({ payload: {} }));
});

test('runEndpoint passes the user to createLowdefyContext and logs the resolved caller', async () => {
  const user = { roles: ['admin'], organization_id: 'org_1' };
  mockCreateLowdefyContext.mockResolvedValue({
    ...context,
    user: { id: 'u_1', roles: ['admin'], email: 'a@b.c' },
  });

  await runEndpoint({ endpointId: 'create_order', user, honoContext });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user });
  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_run_endpoint',
    endpointId: 'create_order',
    user: { id: 'u_1', roles: ['admin'] },
  });
});

test('runEndpoint returns a :reject as data rather than throwing', async () => {
  mockCallEndpoint.mockResolvedValue({
    error: { name: 'Error', message: 'Out of stock.' },
    response: null,
    status: 'reject',
    success: false,
  });

  const result = await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(result).toEqual({
    refused: false,
    error: { name: 'Error', message: 'Out of stock.' },
    response: null,
    status: 'reject',
    success: false,
  });
});

test('runEndpoint returns a :throw as data with status error', async () => {
  mockCallEndpoint.mockResolvedValue({
    error: { name: 'Error', message: 'Payment provider down.' },
    response: null,
    status: 'error',
    success: false,
  });

  const result = await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(result.refused).toBe(false);
  expect(result.success).toBe(false);
  expect(result.status).toBe('error');
  expect(result.error.message).toBe('Payment provider down.');
});

test('runEndpoint returns faults that escape callEndpoint as an error object', async () => {
  const fault = new ConfigError('API Endpoint "internal_only" does not exist.', {
    configKey: 'k1',
  });
  fault.source = 'api/internal.yaml:3';
  mockCallEndpoint.mockRejectedValue(fault);

  const result = await runEndpoint({ endpointId: 'internal_only', honoContext });

  expect(mockHandleError).toHaveBeenCalledWith(fault);
  expect(result).toEqual({
    refused: false,
    error: {
      name: 'ConfigError',
      message: 'API Endpoint "internal_only" does not exist.',
      source: 'api/internal.yaml:3',
      configKey: 'k1',
    },
  });
});

test('runEndpoint truncates an oversized response', async () => {
  mockCallEndpoint.mockResolvedValue({
    error: null,
    response: 'x'.repeat(MAX_RESPONSE_CHARS + 10),
    status: 'success',
    success: true,
  });

  const result = await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(result.refused).toBe(false);
  expect(result.truncated).toBe(true);
  expect(result.response).toHaveLength(MAX_RESPONSE_CHARS);
  expect(result.note).toMatch(/Response truncated to/);
  expect(result.status).toBe('success');
});

test('runEndpoint without explain passes no trace and returns no explain key', async () => {
  const result = await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(mockCallEndpoint.mock.calls[0][1].trace).toBeUndefined();
  expect(result).not.toHaveProperty('explain');
});

test('runEndpoint with explain: true returns one explain entry per request step, each carrying its stepId', async () => {
  mockCreateLowdefyContext.mockResolvedValue({
    ...context,
    user: { id: 'u_1', organization_id: 'org_1', roles: ['admin'], email: 'a@b.c' },
  });
  mockCallEndpoint.mockImplementation(async (ctx, { trace }) => {
    trace.push({
      stepId: 'find_order',
      rewritten: [{ at: 'query', injected: { organization_id: 'org_1' } }],
      connection: {
        id: 'orders',
        type: 'MongoDBCollection',
        tenant: { field: 'organization_id', value: 'org_1' },
      },
      properties: { query: { sku: 'A1' } },
      effective: {
        query: { $and: [{ sku: 'A1' }, { organization_id: 'org_1' }] },
        options: undefined,
      },
    });
    trace.push({
      stepId: 'notify',
      rewritten: [],
      connection: { id: 'mail', type: 'SendGridMail', tenant: null },
      properties: { to: 'a@b.c' },
    });
    return { error: null, response: { ok: true }, status: 'success', success: true };
  });

  const result = await runEndpoint({ endpointId: 'create_order', explain: true, honoContext });

  expect(mockCallEndpoint.mock.calls[0][1].trace).toEqual(expect.any(Array));
  expect(result.success).toBe(true);
  expect(result.explain).toEqual([
    {
      stepId: 'find_order',
      caller: { id: 'u_1', organization_id: 'org_1', roles: ['admin'] },
      connection: {
        id: 'orders',
        type: 'MongoDBCollection',
        tenant: { field: 'organization_id', value: 'org_1' },
      },
      properties: { query: { sku: 'A1' } },
      effective: {
        query: { $and: [{ sku: 'A1' }, { organization_id: 'org_1' }] },
        options: undefined,
      },
      rewritten: [{ at: 'query', injected: { organization_id: 'org_1' } }],
    },
    {
      stepId: 'notify',
      caller: { id: 'u_1', organization_id: 'org_1', roles: ['admin'] },
      connection: { id: 'mail', type: 'SendGridMail', tenant: null },
      properties: { to: 'a@b.c' },
      effective: null,
      rewritten: [],
      note: 'The request did not reach the driver — it failed before the resolver ran, so there is no effective query.',
    },
  ]);
});

test('runEndpoint returns a routine that ends without :return as a success', async () => {
  // buildEndpointResult produces response: undefined for a routine with no
  // :return - an entirely ordinary endpoint, not a failure.
  mockCallEndpoint.mockResolvedValue({
    error: null,
    response: undefined,
    status: 'success',
    success: true,
  });

  const result = await runEndpoint({ endpointId: 'create_order', honoContext });

  expect(result).toEqual({
    refused: false,
    error: null,
    response: undefined,
    status: 'success',
    success: true,
  });
});
