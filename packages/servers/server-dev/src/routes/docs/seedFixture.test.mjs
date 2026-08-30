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

const mockSeedFixture = jest.fn();

jest.unstable_mockModule('../../../lib/docs/seedFixture.js', () => ({
  default: mockSeedFixture,
}));

const { ConfigError } = await import('@lowdefy/errors');
const { default: docsSeedFixtureHandler } = await import('./seedFixture.js');

function createContext(body) {
  const request = new Request('http://localhost:3242/lowdefy-docs/seed-fixture', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  return { req: { raw: request }, json };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSeedFixture.mockResolvedValue({
    refused: false,
    seeded: [{ connectionId: 'controls', collection: 'controls', deleted: 0, inserted: 2 }],
  });
});

test('docsSeedFixtureHandler passes name and reset through and returns the seedFixture result as 200', async () => {
  const c = createContext({ name: 'base', reset: true });
  const result = await docsSeedFixtureHandler(c);
  expect(mockSeedFixture).toHaveBeenCalledWith({ name: 'base', reset: true, honoContext: c });
  expect(result.status).toBe(200);
  expect(result.data).toEqual({
    refused: false,
    seeded: [{ connectionId: 'controls', collection: 'controls', deleted: 0, inserted: 2 }],
  });
});

test('docsSeedFixtureHandler leaves reset undefined when the body omits it', async () => {
  const c = createContext({ name: 'base' });
  await docsSeedFixtureHandler(c);
  expect(mockSeedFixture).toHaveBeenCalledWith({ name: 'base', reset: undefined, honoContext: c });
});

test('docsSeedFixtureHandler returns a refusal as 200 data', async () => {
  mockSeedFixture.mockResolvedValue({
    refused: true,
    reason: 'Seeding writes to the dev database.',
    howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
  });
  const result = await docsSeedFixtureHandler(createContext({ name: 'base' }));
  expect(result.status).toBe(200);
  expect(result.data.refused).toBe(true);
  expect(result.data.howToEnable).toContain('cli.agentTools.allowWriteRequests');
});

test('docsSeedFixtureHandler returns 400 for malformed input thrown as a ConfigError', async () => {
  mockSeedFixture.mockRejectedValue(
    new ConfigError('seed_fixture requires a "name" string. Received undefined.')
  );
  const result = await docsSeedFixtureHandler(createContext({}));
  expect(result.status).toBe(400);
  expect(result.data).toEqual({
    error: 'seed_fixture requires a "name" string. Received undefined.',
  });
});

test('docsSeedFixtureHandler propagates other faults', async () => {
  mockSeedFixture.mockRejectedValue(new Error('boom'));
  await expect(docsSeedFixtureHandler(createContext({ name: 'base' }))).rejects.toThrow('boom');
});
