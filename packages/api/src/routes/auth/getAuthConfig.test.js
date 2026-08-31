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

const mockAdapter = jest.fn(() => undefined);
const mockCallbacks = jest.fn(() => ({}));
const mockEvents = jest.fn(() => ({}));
const mockProviders = jest.fn(() => []);
const mockLogger = jest.fn(() => ({}));

jest.unstable_mockModule('./createAdapter.js', () => ({ default: mockAdapter }));
jest.unstable_mockModule('./callbacks/createCallbacks.js', () => ({ default: mockCallbacks }));
jest.unstable_mockModule('./events/createEvents.js', () => ({ default: mockEvents }));
jest.unstable_mockModule('./createProviders.js', () => ({ default: mockProviders }));
jest.unstable_mockModule('./createLogger.js', () => ({ default: mockLogger }));

test('getAuthConfig resolves `_app` in authJson and sets Auth.js v5 config fields', async () => {
  process.env.AUTH_SECRET = 'secret-for-test';
  delete process.env.NEXTAUTH_SECRET;
  const { default: getAuthConfig } = await import('./getAuthConfig.js');
  const authJson = {
    name: { _app: 'name' },
  };
  const result = getAuthConfig({
    appMeta: { slug: 'my-app', name: 'My App' },
    authJson,
    logger: { isLevelEnabled: () => false },
    plugins: { adapters: {}, callbacks: {}, events: {}, providers: {} },
    secrets: {},
  });
  // synchronous: a real object, not a Promise
  expect(result).not.toBeInstanceOf(Promise);
  expect(result).toEqual(expect.any(Object));
  // createCallbacks receives the resolved authConfig (object form), confirming
  // the parser ran the `_app` lookup against the supplied appMeta.
  expect(mockCallbacks).toHaveBeenCalled();
  const callArgs = mockCallbacks.mock.calls[0][0];
  expect(callArgs.authConfig.name).toBe('My App');
  // Auth.js v5 engine fields.
  expect(result.trustHost).toBe(true);
  expect(result.basePath).toBe('/api/auth');
  expect(result.secret).toBe('secret-for-test');
  delete process.env.AUTH_SECRET;
});

test('getAuthConfig returns the cached config on subsequent calls', async () => {
  const { default: getAuthConfig } = await import('./getAuthConfig.js');
  const first = getAuthConfig({
    appMeta: {},
    authJson: {},
    logger: { isLevelEnabled: () => false },
    plugins: { adapters: {}, callbacks: {}, events: {}, providers: {} },
    secrets: {},
  });
  const second = getAuthConfig({
    appMeta: {},
    authJson: {},
    logger: { isLevelEnabled: () => false },
    plugins: { adapters: {}, callbacks: {}, events: {}, providers: {} },
    secrets: {},
  });
  expect(second).toBe(first);
});
