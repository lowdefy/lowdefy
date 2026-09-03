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

const mockRunRequest = jest.fn();

// parseUserParam resolves dev user fixtures, which read build/auth.json from a
// running server directory - the artifact is mocked as an app without fixtures.
jest.unstable_mockModule('../../../lib/build/auth.js', () => ({
  default: {},
}));
jest.unstable_mockModule('../../../lib/docs/runRequest.js', () => ({
  default: mockRunRequest,
}));

const { default: docsRunRequestHandler } = await import('./runRequest.js');

function createContext(body) {
  const request = new Request('http://localhost:3204/lowdefy-docs/run-request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  return { req: { raw: request }, json };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRunRequest.mockResolvedValue({ refused: false, response: [] });
});

test('docsRunRequestHandler passes a user object through to runRequest', async () => {
  const c = createContext({
    pageId: 'home',
    requestId: 'get_rows',
    user: { roles: ['admin'] },
  });

  await docsRunRequestHandler(c);

  expect(mockRunRequest).toHaveBeenCalledWith({
    pageId: 'home',
    requestId: 'get_rows',
    payload: undefined,
    user: { roles: ['admin'] },
    honoContext: c,
  });
});

test('docsRunRequestHandler returns 400 when user is malformed JSON', async () => {
  const c = createContext({ pageId: 'home', requestId: 'get_rows', user: '{"roles":' });

  const result = await docsRunRequestHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/must be JSON/);
  expect(mockRunRequest).not.toHaveBeenCalled();
});

test('docsRunRequestHandler returns 400 when user names an undeclared dev user', async () => {
  const c = createContext({ pageId: 'home', requestId: 'get_rows', user: 'admin' });

  const result = await docsRunRequestHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/No dev users are declared/);
  expect(mockRunRequest).not.toHaveBeenCalled();
});

test('docsRunRequestHandler passes an undefined user when the body omits it', async () => {
  const c = createContext({ pageId: 'home', requestId: 'get_rows' });

  await docsRunRequestHandler(c);

  expect(mockRunRequest).toHaveBeenCalledWith({
    pageId: 'home',
    requestId: 'get_rows',
    payload: undefined,
    user: undefined,
    honoContext: c,
  });
});

test('docsRunRequestHandler passes explain: true through to runRequest and returns its explain', async () => {
  mockRunRequest.mockResolvedValue({
    refused: false,
    response: [],
    explain: { caller: { id: 'u_1', organization_id: 'org_1', roles: [] }, rewritten: [] },
  });
  const c = createContext({ pageId: 'home', requestId: 'get_rows', explain: true });

  const result = await docsRunRequestHandler(c);

  expect(mockRunRequest).toHaveBeenCalledWith({
    pageId: 'home',
    requestId: 'get_rows',
    payload: undefined,
    user: undefined,
    explain: true,
    honoContext: c,
  });
  expect(result.data.explain.caller).toEqual({ id: 'u_1', organization_id: 'org_1', roles: [] });
});
