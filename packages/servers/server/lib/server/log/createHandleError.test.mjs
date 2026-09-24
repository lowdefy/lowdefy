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

const secret = 'planted-handle-error-secret';

process.env.LOWDEFY_SECRET_API_KEY = secret;

const { default: createHandleError } = await import('./createHandleError.js');

function createAxiosError() {
  const error = new Error(`Request failed for key ${secret}`);
  error.name = 'AxiosError';
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    auth: { username: 'svc-user', password: 'planted-config-password' },
    params: { api_key: 'planted-config-param' },
    headers: { Authorization: 'Bearer planted-config-header' },
  };
  return error;
}

function testContext({ logger, headers } = {}) {
  return {
    headers,
    logger: logger ?? { error: jest.fn() },
    readConfigFile: jest.fn(async () => null),
    req: { url: '/api/request/page/req', method: 'POST', hostname: 'app.example.com' },
  };
}

beforeEach(() => {
  console.error = jest.fn();
});

test('handleError logs the referer header with credential query parameters redacted', async () => {
  const context = testContext({
    headers: { referer: 'https://app.example.com/verify?token=planted-token&page=2' },
  });
  const handleError = createHandleError({ context });

  await handleError(new Error('Failed.'));

  const [fields] = context.logger.error.mock.calls[0];
  expect(fields.headers.referer).toBe('https://app.example.com/verify?token=%5Bredacted%5D&page=2');
});

test('handleError fallback output carries no axios config auth and no planted secret when the log call throws', async () => {
  const logError = new Error(`Log sink rejected ${secret}`);
  const context = testContext({
    logger: {
      error: jest.fn(() => {
        throw logError;
      }),
    },
  });
  const handleError = createHandleError({ context });

  await handleError(createAxiosError());

  expect(console.error).toHaveBeenCalledTimes(3);
  const output = console.error.mock.calls.map(([line]) => line).join('\n');
  expect(output).not.toContain('planted-config-password');
  expect(output).not.toContain('planted-config-param');
  expect(output).not.toContain('planted-config-header');
  expect(output).not.toContain(secret);
  const logged = JSON.parse(console.error.mock.calls[0][0]);
  expect(logged.message).toBe('Request failed for key [REDACTED]');
  expect(logged.code).toBe('ERR_BAD_REQUEST');
  expect(JSON.parse(console.error.mock.calls[2][0]).message).toBe('Log sink rejected [REDACTED]');
});
