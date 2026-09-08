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

import apiKey from './apiKey.js';

const longKey = 'k'.repeat(32);
const otherLongKey = 'o'.repeat(32);

function mockLogger() {
  return { debug: jest.fn(), warn: jest.fn() };
}

test('apiKey verify matches a configured key and returns the synthetic caller id', async () => {
  const logger = mockLogger();
  const verify = apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: longKey }] },
    strategyId: 'partner-access',
  });
  const match = await verify({ headers: new Headers({ 'X-API-Key': longKey }), logger });
  expect(match).toEqual({ user: { id: 'apiKey:partner-access:acme' } });
});

test('apiKey verify returns null when the header is absent', async () => {
  const logger = mockLogger();
  const verify = apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: longKey }] },
    strategyId: 'partner-access',
  });
  expect(await verify({ headers: new Headers({}), logger })).toBe(null);
});

test('apiKey verify returns null when the presented key does not match', async () => {
  const logger = mockLogger();
  const verify = apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: longKey }] },
    strategyId: 'partner-access',
  });
  expect(await verify({ headers: new Headers({ 'X-API-Key': otherLongKey }), logger })).toBe(null);
});

test('apiKey verify compares keys of different lengths without throwing', async () => {
  const logger = mockLogger();
  const verify = apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: longKey }] },
    strategyId: 'partner-access',
  });
  expect(await verify({ headers: new Headers({ 'X-API-Key': 'short' }), logger })).toBe(null);
});

test('apiKey verify reads a custom header name', async () => {
  const logger = mockLogger();
  const verify = apiKey({
    logger,
    properties: { headerName: 'X-Partner-Key', keys: [{ id: 'acme', value: longKey }] },
    strategyId: 'partner-access',
  });
  const match = await verify({ headers: new Headers({ 'X-Partner-Key': longKey }), logger });
  expect(match).toEqual({ user: { id: 'apiKey:partner-access:acme' } });
});

test('apiKey verify falls back to the key index when the key has no id', async () => {
  const logger = mockLogger();
  const verify = apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ value: otherLongKey }, { value: longKey }] },
    strategyId: 'partner-access',
  });
  const match = await verify({ headers: new Headers({ 'X-API-Key': longKey }), logger });
  expect(match).toEqual({ user: { id: 'apiKey:partner-access:1' } });
});

test('apiKey warns at startup for keys shorter than 32 characters', () => {
  const logger = mockLogger();
  apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: 'short-key' }] },
    strategyId: 'partner-access',
  });
  expect(logger.warn).toHaveBeenCalledWith(
    'Auth strategy "partner-access" key "acme" is shorter than 32 characters. Use a long random value, e.g. `openssl rand -hex 32`.'
  );
});

test('apiKey does not warn for keys of 32 characters or longer', () => {
  const logger = mockLogger();
  apiKey({
    logger,
    properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: longKey }] },
    strategyId: 'partner-access',
  });
  expect(logger.warn).not.toHaveBeenCalled();
});

test('apiKey throws at startup when a key value did not resolve to a string', () => {
  const logger = mockLogger();
  expect(() =>
    apiKey({
      logger,
      properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: undefined }] },
      strategyId: 'partner-access',
    })
  ).toThrow(
    'Auth strategy "partner-access" key "acme" did not resolve to a string. Check the _secret operator reference and that the secret is set.'
  );
});
