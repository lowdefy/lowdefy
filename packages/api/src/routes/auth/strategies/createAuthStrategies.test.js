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
import { ConfigError } from '@lowdefy/errors';

import createAuthStrategies from './createAuthStrategies.js';

const appMeta = { name: 'Test App', slug: 'test-app' };

function mockLogger() {
  return { debug: jest.fn(), warn: jest.fn() };
}

test('createAuthStrategies returns an empty list when no strategies are configured', () => {
  const logger = mockLogger();
  expect(
    createAuthStrategies({
      appMeta,
      authJson: { configured: true, strategies: [] },
      logger,
      plugins: { strategies: {} },
      secrets: {},
    })
  ).toEqual([]);
  expect(
    createAuthStrategies({
      appMeta,
      authJson: { configured: true },
      logger,
      plugins: { strategies: {} },
      secrets: {},
    })
  ).toEqual([]);
});

test('createAuthStrategies resolves _secret operators and constructs verifiers', () => {
  const logger = mockLogger();
  const verify = async () => null;
  const apiKey = jest.fn(() => verify);
  const strategies = createAuthStrategies({
    appMeta,
    authJson: {
      configured: true,
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: {
            headerName: 'X-API-Key',
            keys: [{ id: 'acme', value: { _secret: 'PARTNER_KEY_ACME' } }],
          },
          roles: ['partner'],
          attributes: { branches: ['north'] },
        },
      ],
    },
    logger,
    plugins: { strategies: { apiKey } },
    secrets: { PARTNER_KEY_ACME: 'resolved-key-value' },
  });
  expect(apiKey).toHaveBeenCalledWith({
    logger,
    properties: {
      headerName: 'X-API-Key',
      keys: [{ id: 'acme', value: 'resolved-key-value' }],
    },
    strategyId: 'partner-access',
  });
  expect(strategies).toEqual([
    {
      attributes: { branches: ['north'] },
      id: 'partner-access',
      roles: ['partner'],
      type: 'apiKey',
      verify,
    },
  ]);
});

test('createAuthStrategies keeps strategies in config order', () => {
  const logger = mockLogger();
  const strategies = createAuthStrategies({
    appMeta,
    authJson: {
      configured: true,
      strategies: [
        { id: 'a', type: 'apiKey', properties: {}, roles: [], attributes: {} },
        { id: 'b', type: 'jwt', properties: {}, roles: [], attributes: {} },
      ],
    },
    logger,
    plugins: { strategies: { apiKey: () => 'verify-a', jwt: () => 'verify-b' } },
    secrets: {},
  });
  expect(strategies.map((strategy) => strategy.id)).toEqual(['a', 'b']);
});

test('createAuthStrategies throws a ConfigError for an unknown strategy type', () => {
  const logger = mockLogger();
  expect(() =>
    createAuthStrategies({
      appMeta,
      authJson: {
        configured: true,
        strategies: [{ id: 'x', type: 'unknown', properties: {}, roles: [], attributes: {} }],
      },
      logger,
      plugins: { strategies: {} },
      secrets: {},
    })
  ).toThrow(new ConfigError('Auth strategy type "unknown" not found at strategy "x".'));
});

test('createAuthStrategies wraps verifier construction errors in a ConfigError', () => {
  const logger = mockLogger();
  let thrown;
  try {
    createAuthStrategies({
      appMeta,
      authJson: {
        configured: true,
        strategies: [
          {
            id: 'partner-access',
            type: 'apiKey',
            properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: undefined }] },
            roles: [],
            attributes: {},
          },
        ],
      },
      logger,
      plugins: {
        strategies: {
          apiKey: () => {
            throw new Error(
              'Auth strategy "partner-access" key "acme" did not resolve to a string.'
            );
          },
        },
      },
      secrets: {},
    });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toBe(
    'Auth strategy "partner-access" key "acme" did not resolve to a string.'
  );
  expect(thrown.cause).toBeInstanceOf(Error);
});
