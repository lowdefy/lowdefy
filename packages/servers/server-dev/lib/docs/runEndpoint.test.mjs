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
const mockGetEndpointConfig = jest.fn();
const mockIsWriteRequestsAllowed = jest.fn();
const mockCreateLowdefyContext = jest.fn();
const mockLoggerInfo = jest.fn();

jest.unstable_mockModule('@lowdefy/api', () => ({
  callEndpoint: mockCallEndpoint,
  getEndpointConfig: mockGetEndpointConfig,
}));
jest.unstable_mockModule('./isWriteRequestsAllowed.js', () => ({
  default: mockIsWriteRequestsAllowed,
}));
jest.unstable_mockModule('../server/createLowdefyContext.js', () => ({
  default: mockCreateLowdefyContext,
}));

const { ConfigError } = await import('@lowdefy/errors');
const { MAX_RESPONSE_CHARS } = await import('./truncateResponse.js');
const { default: runEndpoint } = await import('./runEndpoint.js');

const honoContext = { req: { path: '/lowdefy-docs/run-endpoint' } };
const context = { logger: { info: mockLoggerInfo } };

beforeEach(() => {
  jest.clearAllMocks();
  mockIsWriteRequestsAllowed.mockResolvedValue(true);
  mockCreateLowdefyContext.mockResolvedValue(context);
  mockGetEndpointConfig.mockResolvedValue({ id: 'endpoint:create_order', type: 'Api' });
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

test('runEndpoint throws a ConfigError when user is not an object', async () => {
  await expect(
    runEndpoint({ endpointId: 'create_order', user: 'admin', honoContext })
  ).rejects.toThrow(ConfigError);
  await expect(
    runEndpoint({ endpointId: 'create_order', user: ['admin'], honoContext })
  ).rejects.toThrow(/run_endpoint "user" must be an object/);
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
  expect(mockGetEndpointConfig).not.toHaveBeenCalled();
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

test('runEndpoint returns a not-found refusal when the endpoint does not exist', async () => {
  mockGetEndpointConfig.mockRejectedValue(
    new ConfigError('API Endpoint "missing_endpoint" does not exist.')
  );

  const result = await runEndpoint({ endpointId: 'missing_endpoint', honoContext });

  expect(result).toEqual({
    refused: true,
    reason:
      'Endpoint "missing_endpoint" was not found. See GET /lowdefy-docs/app-map for the endpoints that exist.',
  });
  expect(mockGetEndpointConfig).toHaveBeenCalledWith(context, { endpointId: 'missing_endpoint' });
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

test('runEndpoint passes the user to createLowdefyContext and logs the run', async () => {
  const user = { roles: ['admin'], organization_id: 'org_1' };

  await runEndpoint({ endpointId: 'create_order', user, honoContext });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user });
  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_run_endpoint',
    endpointId: 'create_order',
    user,
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
