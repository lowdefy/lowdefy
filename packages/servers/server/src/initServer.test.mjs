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
const guards = { env: { BETTER_AUTH_URL: '^https://app\\.example\\.com$' } };

const checkEnvironmentGuards = jest.fn(() => {
  calls.push('checkEnvironmentGuards');
});
const captureException = jest.fn();
const flush = jest.fn(async () => true);
const sentry = { captureException, flush };
const initSentryServer = jest.fn(async () => {
  calls.push('initSentryServer');
  return null;
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

// The app module is imported once and then cached, so find the run that imported it rather than
// assuming this test runs first.
test('initServer initialises Sentry and checks the guards before importing the app', async () => {
  const result = await initServer();
  const importIndex = calls.indexOf('import app');
  expect(calls.slice(importIndex - 2, importIndex + 1)).toEqual([
    'initSentryServer',
    'checkEnvironmentGuards',
    'import app',
  ]);
  expect(result.createApp).toBe(createApp);
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

test('initServer sends a guard failure to Sentry and flushes it before throwing', async () => {
  const error = new Error('Environment "prod" guards failed.');
  initSentryServer.mockResolvedValueOnce(sentry);
  checkEnvironmentGuards.mockImplementationOnce(() => {
    throw error;
  });
  await expect(initServer()).rejects.toBe(error);
  expect(captureException.mock.calls).toEqual([[error]]);
  expect(flush).toHaveBeenCalled();
});

test('initServer throws a guard failure without Sentry when Sentry was not started', async () => {
  const error = new Error('Environment "prod" guards failed.');
  checkEnvironmentGuards.mockImplementationOnce(() => {
    throw error;
  });
  await expect(initServer()).rejects.toBe(error);
  expect(captureException).not.toHaveBeenCalled();
});

test('initServer starts Sentry for a long-running server unless the entry is serverless', async () => {
  await initServer();
  await initServer({ serverless: true });
  expect(initSentryServer.mock.calls).toEqual([[{ serverless: false }], [{ serverless: true }]]);
});

test('initServer logs that Sentry is enabled and returns its SDK when Sentry was started', async () => {
  initSentryServer.mockResolvedValueOnce(sentry);
  const result = await initServer();
  expect(result.sentry).toBe(sentry);
  expect(info.mock.calls).toEqual([['Sentry enabled: server']]);
});

test('initServer does not log Sentry when Sentry was not started', async () => {
  const result = await initServer();
  expect(result.sentry).toBe(null);
  expect(info).not.toHaveBeenCalled();
});
