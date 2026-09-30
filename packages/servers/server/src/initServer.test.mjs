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

const calls = [];
const info = jest.fn();
const guards = { env: { AUTH_URL: '^https://app\\.example\\.com$' } };

const checkEnvironmentGuards = jest.fn();
const initSentryServer = jest.fn(() => {
  calls.push('initSentryServer');
  return false;
});
const createApp = jest.fn();

jest.unstable_mockModule('@lowdefy/node-utils/checkEnvironmentGuards.js', () => ({
  default: checkEnvironmentGuards,
}));
jest.unstable_mockModule('../lib/server/sentry/initSentry.js', () => ({
  default: initSentryServer,
}));
jest.unstable_mockModule('./app.js', () => {
  calls.push('import app');
  return { default: createApp };
});
jest.unstable_mockModule('../lib/server/log/createLogger.js', () => ({
  default: () => ({ info }),
}));
jest.unstable_mockModule('../lib/build/config.js', () => ({
  default: { environment: 'prod', environments: { prod: { guards } } },
}));

const { default: initServer } = await import('./initServer.js');

beforeEach(() => {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
});

test('initServer initialises Sentry before importing the app', async () => {
  const result = await initServer();
  expect(calls).toEqual(['initSentryServer', 'import app']);
  expect(result.createApp).toBe(createApp);
});

test('initServer aliases NEXTAUTH_URL to AUTH_URL when AUTH_URL is not set', async () => {
  process.env.NEXTAUTH_URL = 'https://nextauth.example.com';
  await initServer();
  expect(process.env.AUTH_URL).toBe('https://nextauth.example.com');
});

test('initServer keeps an AUTH_URL that is already set', async () => {
  process.env.AUTH_URL = 'https://auth.example.com';
  process.env.NEXTAUTH_URL = 'https://nextauth.example.com';
  await initServer();
  expect(process.env.AUTH_URL).toBe('https://auth.example.com');
});

test('initServer checks the current environment guards', async () => {
  await initServer();
  expect(checkEnvironmentGuards.mock.calls).toEqual([[{ name: 'prod', guards }]]);
});

test('initServer throws when the current environment guards fail', async () => {
  checkEnvironmentGuards.mockImplementationOnce(() => {
    throw new Error('Environment "prod" guards failed.');
  });
  await expect(initServer()).rejects.toThrow('Environment "prod" guards failed.');
});

test('initServer logs that Sentry is enabled when Sentry was initialised', async () => {
  initSentryServer.mockReturnValueOnce(true);
  const { sentryEnabled } = await initServer();
  expect(sentryEnabled).toBe(true);
  expect(info.mock.calls).toEqual([['Sentry enabled: server']]);
});

test('initServer does not log Sentry when Sentry was not initialised', async () => {
  const { sentryEnabled } = await initServer();
  expect(sentryEnabled).toBe(false);
  expect(info).not.toHaveBeenCalled();
});
