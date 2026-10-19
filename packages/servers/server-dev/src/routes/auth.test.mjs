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

const handleAuthRequest = jest.fn(async () => new Response('engine'));
const getAuth = jest.fn(() => ({}));

jest.unstable_mockModule('@lowdefy/api', () => ({ handleAuthRequest }));
jest.unstable_mockModule('../../lib/build/auth.js', () => ({ default: { configured: true } }));
jest.unstable_mockModule('../../lib/server/auth/getAuth.js', () => ({ default: getAuth }));
jest.unstable_mockModule('../../lib/server/auth/getMockUser.js', () => ({
  default: jest.fn(() => undefined),
}));
jest.unstable_mockModule('../../lib/server/getClientAddress.js', () => ({
  default: jest.fn(() => '127.0.0.1'),
}));

const { default: authMiddleware } = await import('./auth.js');

function createHonoContext({ context }) {
  return {
    get: (key) => (key === 'lowdefyContext' ? context : undefined),
    json: (body, status) => ({ body, status }),
    body: (body, status) => ({ body, status }),
    req: { method: 'POST', raw: new Request('http://localhost/api/auth/sign-out') },
  };
}

test('authMiddleware refuses a data-session request without reaching the auth engine', async () => {
  const handler = authMiddleware({ logger: {} });
  const result = await handler(createHonoContext({ context: { dataSet: 'staging-sample' } }));
  expect(result).toEqual({
    body: { message: 'Auth engine disabled for journeys on a data set' },
    status: 404,
  });
  expect(getAuth).not.toHaveBeenCalled();
  expect(handleAuthRequest).not.toHaveBeenCalled();
});

test('authMiddleware hands a request with no data session to the auth engine', async () => {
  const handler = authMiddleware({ logger: {} });
  await handler(createHonoContext({ context: {} }));
  expect(handleAuthRequest).toHaveBeenCalledTimes(1);
});
