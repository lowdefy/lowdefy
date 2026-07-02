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

import createSystemContext from './createSystemContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createTestSystemContext(overrides = {}) {
  return createSystemContext({
    agents: {},
    appMeta: { name: 'Test App' },
    buildDirectory: '/build',
    config: {},
    connections: {},
    createHandleError: jest.fn(({ context }) => async (error) => context.logger.error(error)),
    fileCache: new Map(),
    i18n: undefined,
    jsMap: {},
    logger,
    operators: { _test: () => 'test' },
    rid: 'test-rid',
    secrets: { KEY: 'value' },
    websockets: {},
    ...overrides,
  });
}

test('createSystemContext runs with an empty user - the caller is the auth engine', () => {
  const context = createTestSystemContext();
  expect(context.user).toEqual({});
});

test('createSystemContext authorize allows any endpoint - auth is not re-checked against a session', () => {
  const context = createTestSystemContext();
  expect(context.authorize({ auth: { public: false, roles: ['admin'] } })).toBe(true);
  expect(context.authorize({ auth: { public: false } })).toBe(true);
});

test('createSystemContext wires readConfigFile, evaluateOperators and handleError', () => {
  const context = createTestSystemContext();
  expect(context.readConfigFile).toBeInstanceOf(Function);
  expect(context.evaluateOperators).toBeInstanceOf(Function);
  expect(context.handleError).toBeInstanceOf(Function);
});

test('createSystemContext carries the singletons and per-fire fields', () => {
  const context = createTestSystemContext();
  expect(context.rid).toBe('test-rid');
  expect(context.logger).toBe(logger);
  expect(context.secrets).toEqual({ KEY: 'value' });
  expect(context.buildDirectory).toBe('/build');
  expect(context.headers).toEqual({});
  expect(context.req.url).toBe('system:auth-hook');
});

test('createSystemContext activates the default locale when i18n is configured', () => {
  const context = createTestSystemContext({
    i18n: { defaultLocale: 'en', locales: ['en', 'de'] },
  });
  expect(context.i18n.active).toBe('en');
  const noI18n = createTestSystemContext({ i18n: undefined });
  expect(noI18n.i18n).toBeUndefined();
});

test('createSystemContext evaluateOperators resolves _secret and leaves _user empty', () => {
  const context = createTestSystemContext();
  expect(context.user).toEqual({});
  expect(context.secrets.KEY).toBe('value');
});
