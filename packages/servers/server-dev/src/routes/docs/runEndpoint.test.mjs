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

const mockRunEndpoint = jest.fn();

// parseUserParam resolves dev user fixtures, which read build/auth.json from a
// running server directory - the artifact is mocked as an app without fixtures.
jest.unstable_mockModule('../../../lib/build/auth.js', () => ({
  default: {},
}));
jest.unstable_mockModule('../../../lib/docs/runEndpoint.js', () => ({
  default: mockRunEndpoint,
}));

const { ConfigError } = await import('@lowdefy/errors');
const { default: docsRunEndpointHandler } = await import('./runEndpoint.js');

function createContext(body) {
  const request = new Request('http://localhost:3224/lowdefy-docs/run-endpoint', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  return { req: { raw: request }, json };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRunEndpoint.mockResolvedValue({ refused: false, status: 'success', response: { ok: true } });
});

test('docsRunEndpointHandler passes endpointId, payload and a user object through to runEndpoint', async () => {
  const c = createContext({
    endpointId: 'create_order',
    payload: { sku: 'A1' },
    user: { roles: ['admin'] },
  });

  const result = await docsRunEndpointHandler(c);

  expect(mockRunEndpoint).toHaveBeenCalledWith({
    endpointId: 'create_order',
    payload: { sku: 'A1' },
    user: { roles: ['admin'] },
    honoContext: c,
  });
  expect(result.status).toBe(200);
  expect(result.data).toEqual({ refused: false, status: 'success', response: { ok: true } });
});

test('docsRunEndpointHandler leaves the original request body readable', async () => {
  const c = createContext({ endpointId: 'create_order' });

  await docsRunEndpointHandler(c);

  expect(c.req.raw.bodyUsed).toBe(false);
  await expect(c.req.raw.json()).resolves.toEqual({ endpointId: 'create_order' });
});

test('docsRunEndpointHandler passes a dev user fixture name through unresolved', async () => {
  // runEndpoint resolves it: one resolver, so REST and MCP refuse an unknown
  // name with the same message, as the ConfigError case below.
  const c = createContext({ endpointId: 'create_order', user: 'admin' });

  await docsRunEndpointHandler(c);

  expect(mockRunEndpoint).toHaveBeenCalledWith(expect.objectContaining({ user: 'admin' }));
});

test('docsRunEndpointHandler returns 400 when runEndpoint refuses an undeclared dev user', async () => {
  mockRunEndpoint.mockRejectedValue(new ConfigError('Unknown dev user "nope".'));
  const c = createContext({ endpointId: 'create_order', user: 'nope' });

  const result = await docsRunEndpointHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toEqual('Unknown dev user "nope".');
});

test('docsRunEndpointHandler passes an undefined user when the body omits it', async () => {
  const c = createContext({ endpointId: 'create_order' });

  await docsRunEndpointHandler(c);

  expect(mockRunEndpoint).toHaveBeenCalledWith({
    endpointId: 'create_order',
    payload: undefined,
    user: undefined,
    honoContext: c,
  });
});

test('docsRunEndpointHandler returns 400 when runEndpoint throws a ConfigError', async () => {
  mockRunEndpoint.mockRejectedValue(
    new ConfigError('run_endpoint requires an "endpointId" string. Received undefined.')
  );
  const c = createContext({ payload: {} });

  const result = await docsRunEndpointHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/requires an "endpointId" string/);
});

test('docsRunEndpointHandler returns refusals and rejects as 200 data', async () => {
  mockRunEndpoint.mockResolvedValue({
    refused: false,
    success: false,
    status: 'reject',
    error: { name: 'Error', message: 'Out of stock.' },
    response: null,
  });
  const c = createContext({ endpointId: 'create_order' });

  const result = await docsRunEndpointHandler(c);

  expect(result.status).toBe(200);
  expect(result.data.status).toBe('reject');
});

test('docsRunEndpointHandler rethrows faults that are not ConfigErrors', async () => {
  mockRunEndpoint.mockRejectedValue(new Error('boom'));
  const c = createContext({ endpointId: 'create_order' });

  await expect(docsRunEndpointHandler(c)).rejects.toThrow('boom');
});

test('docsRunEndpointHandler passes explain: true through to runEndpoint', async () => {
  const c = createContext({ endpointId: 'create_order', explain: true });

  await docsRunEndpointHandler(c);

  expect(mockRunEndpoint).toHaveBeenCalledWith({
    endpointId: 'create_order',
    payload: undefined,
    user: undefined,
    explain: true,
    honoContext: c,
  });
});
