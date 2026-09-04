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

// seedFixture reads the fixture file, builds a Lowdefy context and calls into
// @lowdefy/api - all of which only exist in a running server directory, so mock
// them and leave seedFixture's own gating, ordering, logging and pass-through
// under test.
const mockCallConnectionRequest = jest.fn();
const mockReadFixture = jest.fn();
const mockIsWriteRequestsAllowed = jest.fn();
const mockCreateLowdefyContext = jest.fn();
const mockReadBuildArtifact = jest.fn();
const mockPublish = jest.fn();
const mockLoggerInfo = jest.fn();

jest.unstable_mockModule('@lowdefy/api', () => ({
  callConnectionRequest: mockCallConnectionRequest,
}));
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readFixture: mockReadFixture,
}));
jest.unstable_mockModule('./isWriteRequestsAllowed.js', () => ({
  default: mockIsWriteRequestsAllowed,
}));
jest.unstable_mockModule('../server/createLowdefyContext.js', () => ({
  default: mockCreateLowdefyContext,
}));
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: mockReadBuildArtifact,
}));
jest.unstable_mockModule('./devEventBus.js', () => ({
  publish: mockPublish,
}));

const { ConfigError } = await import('@lowdefy/errors');
const { default: seedFixture } = await import('./seedFixture.js');

const honoContext = { req: { path: '/lowdefy-docs/seed-fixture' } };
const context = { logger: { info: mockLoggerInfo } };
const createdAt = new Date('2026-01-01T00:00:00.000Z');
const baseFixture = {
  name: 'base',
  connections: [
    { connectionId: 'organizations', docs: [{ _id: 'org_a', created_at: createdAt }] },
    { connectionId: 'controls', docs: [{ _id: 'c1' }, { _id: 'c2' }] },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsWriteRequestsAllowed.mockResolvedValue(true);
  mockCreateLowdefyContext.mockResolvedValue(context);
  mockReadFixture.mockResolvedValue(baseFixture);
  mockReadBuildArtifact.mockImplementation(({ name }) => ({
    properties: { collection: name.replace('connections/', '').replace('.json', '_col') },
  }));
  mockCallConnectionRequest.mockImplementation(async (_, { type, properties }) => {
    if (type === 'MongoDBDeleteMany') {
      return { response: { acknowledged: true, deletedCount: 7 } };
    }
    return { response: { acknowledged: true, insertedCount: properties.docs.length } };
  });
});

test('seedFixture throws a ConfigError when name is missing or not a string', async () => {
  await expect(seedFixture({ honoContext })).rejects.toThrow(ConfigError);
  await expect(seedFixture({ honoContext })).rejects.toThrow(
    'seed_fixture requires a "name" string. Received undefined.'
  );
  await expect(seedFixture({ name: 3, honoContext })).rejects.toThrow(
    'seed_fixture requires a "name" string. Received 3.'
  );
  expect(mockIsWriteRequestsAllowed).not.toHaveBeenCalled();
});

test('seedFixture throws a ConfigError when reset is not a boolean', async () => {
  await expect(seedFixture({ name: 'base', reset: 'yes', honoContext })).rejects.toThrow(
    'seed_fixture "reset" must be a boolean. Received "yes".'
  );
  expect(mockIsWriteRequestsAllowed).not.toHaveBeenCalled();
});

test('seedFixture refuses with howToEnable when agent write access is disabled', async () => {
  mockIsWriteRequestsAllowed.mockResolvedValue(false);
  const result = await seedFixture({ name: 'base', honoContext });
  expect(result).toEqual({
    refused: true,
    reason: 'Seeding writes to the dev database.',
    howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
  });
  expect(mockReadFixture).not.toHaveBeenCalled();
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
  expect(mockCallConnectionRequest).not.toHaveBeenCalled();
  expect(mockPublish).not.toHaveBeenCalled();
});

test('seedFixture inserts every connection through the connection layer with tenant null and no reset by default', async () => {
  const result = await seedFixture({ name: 'base', honoContext });
  expect(mockReadFixture).toHaveBeenCalledWith({ configDirectory: process.cwd(), name: 'base' });
  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user: undefined });
  expect(mockCallConnectionRequest).toHaveBeenCalledTimes(2);
  expect(mockCallConnectionRequest).toHaveBeenNthCalledWith(1, context, {
    connectionId: 'organizations',
    requestId: 'seed_fixture:organizations',
    type: 'MongoDBInsertMany',
    properties: { docs: [{ _id: 'org_a', created_at: createdAt }] },
    rawProperties: true,
    tenant: null,
  });
  expect(mockCallConnectionRequest).toHaveBeenNthCalledWith(2, context, {
    connectionId: 'controls',
    requestId: 'seed_fixture:controls',
    type: 'MongoDBInsertMany',
    properties: { docs: [{ _id: 'c1' }, { _id: 'c2' }] },
    rawProperties: true,
    tenant: null,
  });
  expect(result).toEqual({
    refused: false,
    seeded: [
      { connectionId: 'organizations', collection: 'organizations_col', deleted: 0, inserted: 1 },
      { connectionId: 'controls', collection: 'controls_col', deleted: 0, inserted: 2 },
    ],
  });
});

test('seedFixture with reset deletes each collection before inserting into it', async () => {
  const result = await seedFixture({ name: 'base', reset: true, honoContext });
  const calls = mockCallConnectionRequest.mock.calls.map(
    ([, { connectionId, type, properties }]) =>
      `${type}:${connectionId}:${JSON.stringify(properties)}`
  );
  expect(calls).toEqual([
    'MongoDBDeleteMany:organizations:{"filter":{}}',
    'MongoDBInsertMany:organizations:{"docs":[{"_id":"org_a","created_at":"2026-01-01T00:00:00.000Z"}]}',
    'MongoDBDeleteMany:controls:{"filter":{}}',
    'MongoDBInsertMany:controls:{"docs":[{"_id":"c1"},{"_id":"c2"}]}',
  ]);
  mockCallConnectionRequest.mock.calls.forEach(([, params]) => {
    expect(params.tenant).toBeNull();
  });
  expect(result.seeded).toEqual([
    { connectionId: 'organizations', collection: 'organizations_col', deleted: 7, inserted: 1 },
    { connectionId: 'controls', collection: 'controls_col', deleted: 7, inserted: 2 },
  ]);
});

test('seedFixture with reset empties a connection whose fixture list is empty without inserting', async () => {
  mockReadFixture.mockResolvedValue({
    name: 'clear',
    connections: [{ connectionId: 'controls', docs: [] }],
  });
  const result = await seedFixture({ name: 'clear', reset: true, honoContext });
  expect(mockCallConnectionRequest).toHaveBeenCalledTimes(1);
  expect(mockCallConnectionRequest.mock.calls[0][1].type).toEqual('MongoDBDeleteMany');
  expect(result.seeded).toEqual([
    { connectionId: 'controls', collection: 'controls_col', deleted: 7, inserted: 0 },
  ]);
});

test('seedFixture logs the agent_seed_fixture event with the connectionIds', async () => {
  await seedFixture({ name: 'base', reset: true, honoContext });
  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_seed_fixture',
    name: 'base',
    reset: true,
    connectionIds: ['organizations', 'controls'],
  });
});

test('seedFixture publishes a fixture_seeded event on the push channel after seeding', async () => {
  const result = await seedFixture({ name: 'base', honoContext });
  expect(mockPublish).toHaveBeenCalledTimes(1);
  expect(mockPublish).toHaveBeenCalledWith({
    type: 'fixture_seeded',
    name: 'base',
    reset: false,
    seeded: result.seeded,
  });
});

test('seedFixture returns the fixture loader error as data', async () => {
  const error = new ConfigError('Fixture "nope" not found. Expected fixtures/nope.yaml.');
  mockReadFixture.mockRejectedValue(error);
  const result = await seedFixture({ name: 'nope', honoContext });
  expect(result).toEqual({
    refused: false,
    error: {
      name: 'ConfigError',
      message: 'Fixture "nope" not found. Expected fixtures/nope.yaml.',
    },
  });
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
  expect(mockPublish).not.toHaveBeenCalled();
});

test('seedFixture sends fixture documents as raw properties so an operator-shaped key is stored, not evaluated', async () => {
  mockReadFixture.mockResolvedValue({
    name: 'raw',
    connections: [
      { connectionId: 'controls', docs: [{ _id: 'c1', label: { _secret: 'NOT_A_SECRET' } }] },
    ],
  });
  await seedFixture({ name: 'raw', honoContext });
  const [, params] = mockCallConnectionRequest.mock.calls[0];
  expect(params.rawProperties).toBe(true);
  expect(params.properties.docs).toEqual([{ _id: 'c1', label: { _secret: 'NOT_A_SECRET' } }]);
});

test('seedFixture returns a connection layer failure as data with what was seeded so far and publishes what was written', async () => {
  mockCallConnectionRequest.mockImplementation(async (_, { connectionId }) => {
    if (connectionId === 'controls') {
      throw new ConfigError('Connection "controls" does not allow writes.');
    }
    return { response: { insertedCount: 1 } };
  });
  const result = await seedFixture({ name: 'base', honoContext });
  expect(result).toEqual({
    refused: false,
    error: { name: 'ConfigError', message: 'Connection "controls" does not allow writes.' },
    seeded: [
      { connectionId: 'organizations', collection: 'organizations_col', deleted: 0, inserted: 1 },
    ],
  });
  // The database changed under any agent watching, whether or not every
  // connection made it.
  expect(mockPublish).toHaveBeenCalledWith({
    type: 'fixture_seeded',
    name: 'base',
    reset: false,
    seeded: result.seeded,
  });
});

test('seedFixture reports collection null when the built connection resolves it with an operator', async () => {
  mockReadBuildArtifact.mockReturnValue({ properties: { collection: { _secret: 'COL' } } });
  const result = await seedFixture({ name: 'base', honoContext });
  expect(result.seeded.map((entry) => entry.collection)).toEqual([null, null]);
});
