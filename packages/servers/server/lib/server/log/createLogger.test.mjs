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
import { createNodeLogger } from '@lowdefy/logger/node';

const secret = 'planted/secret+value=1';
const shortSecret = 'short77';

const lines = [];
const destination = {
  write(line) {
    lines.push(line);
  },
};

// The prod logger writes to stdout; route the real logger to memory so each test reads the
// exact line pino would emit, after the streamWrite hook.
jest.unstable_mockModule('@lowdefy/logger/node', () => ({
  createNodeLogger: (options) => createNodeLogger({ ...options, destination }),
}));
jest.unstable_mockModule('../../build/appMeta.js', () => ({ default: {} }));

process.env.LOWDEFY_SECRET_API_KEY = secret;
process.env.LOWDEFY_SECRET_SHORT = shortSecret;
process.env.LOWDEFY_LOG_LEVEL = 'debug';

const { default: createLogger } = await import('./createLogger.js');

function createAxiosError() {
  const error = new Error('Request failed with status code 401');
  error.name = 'AxiosError';
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    auth: { username: 'svc-user', password: 'planted-config-password' },
    params: { api_key: 'planted-config-param' },
    headers: { Authorization: 'Bearer planted-config-header' },
    baseURL: 'https://api.example.com',
  };
  error.response = { status: 401, data: { detail: 'planted-response-body' } };
  return error;
}

beforeEach(() => {
  lines.length = 0;
});

test('prod logger drops an axios error config auth, params and headers', () => {
  createLogger().error({ err: createAxiosError() }, 'Request failed');
  expect(lines).toHaveLength(1);
  const line = lines[0];
  expect(line).not.toContain('planted-config-password');
  expect(line).not.toContain('planted-config-param');
  expect(line).not.toContain('planted-config-header');
  expect(line).not.toContain('planted-response-body');
  const { err } = JSON.parse(line);
  expect(err.config).toBeUndefined();
  expect(err.code).toBe('ERR_BAD_REQUEST');
  expect(err.statusCode).toBe(401);
});

test('prod logger redacts a planted secret in a message raw, URL-encoded and base64', () => {
  const basic = Buffer.from(`svc-user:${secret}`).toString('base64');
  const error = new Error(`raw ${secret} encoded ${encodeURIComponent(secret)} basic ${basic}`);
  createLogger().error({ err: error }, error.message);
  expect(lines).toHaveLength(1);
  const line = lines[0];
  expect(line).not.toContain(secret);
  expect(line).not.toContain(encodeURIComponent(secret));
  expect(line).not.toContain(Buffer.from(secret).toString('base64').slice(0, 20));
  const { msg, err } = JSON.parse(line);
  expect(msg).toMatch(/^raw \[REDACTED\] encoded \[REDACTED\] basic \S*\[REDACTED\]/);
  expect(err.message).toBe(msg);
});

test('prod logger redacts a planted secret in a debug payload that is not an error', () => {
  createLogger({ rid: 'req-1' }).debug({ response: { token: secret } }, 'Request result');
  expect(lines).toHaveLength(1);
  expect(lines[0]).not.toContain(secret);
  expect(JSON.parse(lines[0]).response.token).toBe('[REDACTED]');
});

test('prod logger leaves a secret shorter than 8 characters alone', () => {
  createLogger().info({ detail: shortSecret }, `value ${shortSecret}`);
  expect(lines).toHaveLength(1);
  const { msg, detail } = JSON.parse(lines[0]);
  expect(msg).toBe(`value ${shortSecret}`);
  expect(detail).toBe(shortSecret);
});
