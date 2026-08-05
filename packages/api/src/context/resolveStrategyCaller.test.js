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

import resolveStrategyCaller from './resolveStrategyCaller.js';

function mockLogger() {
  return { debug: jest.fn(), warn: jest.fn() };
}

function mockStrategy({ attributes = {}, id, match = null, roles = [], type = 'apiKey' }) {
  return { attributes, id, roles, type, verify: jest.fn().mockResolvedValue(match) };
}

test('resolveStrategyCaller returns null when no strategies are configured', async () => {
  const logger = mockLogger();
  expect(await resolveStrategyCaller({ headers: {}, logger, strategies: undefined })).toBe(null);
  expect(await resolveStrategyCaller({ headers: {}, logger, strategies: [] })).toBe(null);
});

test('resolveStrategyCaller returns null when no strategy matches', async () => {
  const logger = mockLogger();
  const strategies = [mockStrategy({ id: 'a' }), mockStrategy({ id: 'b' })];
  expect(await resolveStrategyCaller({ headers: {}, logger, strategies })).toBe(null);
  expect(strategies[0].verify).toHaveBeenCalled();
  expect(strategies[1].verify).toHaveBeenCalled();
});

test('resolveStrategyCaller tries strategies in config order and the first match wins', async () => {
  const logger = mockLogger();
  const strategies = [
    mockStrategy({ id: 'first', match: null }),
    mockStrategy({ id: 'second', match: { user: { id: 'caller-2' } }, roles: ['partner'] }),
    mockStrategy({ id: 'third', match: { user: { id: 'caller-3' } } }),
  ];
  const caller = await resolveStrategyCaller({ headers: {}, logger, strategies });
  expect(caller.id).toBe('caller-2');
  expect(caller.strategyId).toBe('second');
  expect(strategies[2].verify).not.toHaveBeenCalled();
});

test('resolveStrategyCaller builds the apiKey caller shape from static grants', async () => {
  const logger = mockLogger();
  const strategies = [
    mockStrategy({
      id: 'partner-access',
      match: { user: { id: 'apiKey:partner-access:acme' } },
      roles: ['partner'],
      attributes: { branches: ['north', 'east'] },
    }),
  ];
  const caller = await resolveStrategyCaller({ headers: {}, logger, strategies });
  expect(caller).toEqual({
    id: 'apiKey:partner-access:acme',
    authMethod: 'apiKey',
    strategyId: 'partner-access',
    roles: ['partner'],
    attributes: { branches: ['north', 'east'] },
  });
});

test('resolveStrategyCaller unions static and claim-derived roles deduplicated', async () => {
  const logger = mockLogger();
  const strategies = [
    mockStrategy({
      id: 'service-jwt',
      type: 'jwt',
      match: { user: { id: 'svc' }, roles: ['api-user', 'reporting'] },
      roles: ['api-user', 'partner'],
    }),
  ];
  const caller = await resolveStrategyCaller({ headers: {}, logger, strategies });
  expect(caller.roles).toEqual(['api-user', 'partner', 'reporting']);
});

test('resolveStrategyCaller merges static attributes with claim-mapped attributes where the claim wins', async () => {
  const logger = mockLogger();
  const strategies = [
    mockStrategy({
      id: 'service-jwt',
      type: 'jwt',
      match: { user: { id: 'svc' }, attributes: { branches: ['claim'], region: 'eu' } },
      attributes: { branches: ['static'], team: 'ops' },
    }),
  ];
  const caller = await resolveStrategyCaller({ headers: {}, logger, strategies });
  expect(caller.attributes).toEqual({ branches: ['claim'], region: 'eu', team: 'ops' });
});

test('resolveStrategyCaller does not let mapped user fields clobber authMethod, strategyId, roles or attributes', async () => {
  const logger = mockLogger();
  const strategies = [
    mockStrategy({
      id: 'service-jwt',
      type: 'jwt',
      match: {
        user: {
          id: 'svc',
          authMethod: 'spoofed',
          strategyId: 'spoofed',
          roles: ['spoofed'],
          attributes: { spoofed: true },
        },
      },
      roles: ['api-user'],
    }),
  ];
  const caller = await resolveStrategyCaller({ headers: {}, logger, strategies });
  expect(caller.authMethod).toBe('jwt');
  expect(caller.strategyId).toBe('service-jwt');
  expect(caller.roles).toEqual(['api-user']);
  expect(caller.attributes).toEqual({});
});

test('resolveStrategyCaller logs which strategy authenticated the request', async () => {
  const logger = mockLogger();
  const strategies = [
    mockStrategy({ id: 'partner-access', match: { user: { id: 'apiKey:partner-access:acme' } } }),
  ];
  await resolveStrategyCaller({ headers: {}, logger, strategies });
  expect(logger.debug).toHaveBeenCalledWith(
    { event: 'auth_strategy_authenticated', authMethod: 'apiKey', strategyId: 'partner-access' },
    'Request authenticated by auth strategy "partner-access" (apiKey).'
  );
});

test('resolveStrategyCaller passes headers and logger to each verifier', async () => {
  const logger = mockLogger();
  const headers = { get: () => null };
  const strategies = [mockStrategy({ id: 'a' })];
  await resolveStrategyCaller({ headers, logger, strategies });
  expect(strategies[0].verify).toHaveBeenCalledWith({ headers, logger });
});
