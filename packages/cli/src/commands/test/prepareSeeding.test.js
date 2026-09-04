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

const mockLoadMemoryMongo = jest.fn();
jest.unstable_mockModule('./loadMemoryMongo.js', () => ({ default: mockLoadMemoryMongo }));
const mockReadFixture = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({ readFixture: mockReadFixture }));

const mockServerStop = jest.fn();
const mockClientConnect = jest.fn();
const mockClientClose = jest.fn();
const mockCreate = jest.fn();
let constructedUris;

class MongoClient {
  constructor(uri) {
    constructedUris.push(uri);
    this.connect = mockClientConnect;
    this.close = mockClientClose;
  }
}

let context;

beforeEach(() => {
  mockReadFixture.mockReset();
  mockReadFixture.mockImplementation(async ({ name }) => ({
    name,
    connections: [{ connectionId: `${name}_connection`, docs: [{ _id: 1 }] }],
  }));
  constructedUris = [];
  mockServerStop.mockReset();
  mockClientConnect.mockReset();
  mockClientClose.mockReset();
  mockLoadMemoryMongo.mockClear();
  context = {
    directories: { config: '/app' },
    options: {},
    logger: { info: jest.fn() },
  };
  mockCreate.mockResolvedValue({
    getUri: () => 'mongodb://127.0.0.1:27999/',
    stop: mockServerStop,
  });
  mockLoadMemoryMongo.mockResolvedValue({
    MongoMemoryServer: { create: mockCreate },
    MongoClient,
    ObjectId: { tag: 'ObjectId' },
  });
});

test('prepareSeeding returns an empty env and no client when nothing is seeded', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  const session = await prepareSeeding({
    context,
    seeds: [{}, {}],
  });
  expect(session.env).toEqual({});
  expect(session.client).toBeNull();
  expect(mockLoadMemoryMongo).not.toHaveBeenCalled();
  await session.stop();
});

test('prepareSeeding starts a memory server and builds overrides for every seeded connection', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  const session = await prepareSeeding({
    context,
    seeds: [{ seed: { controls: [], users: [] } }, { seed: { controls: [] } }],
  });
  expect(mockLoadMemoryMongo).toHaveBeenCalledWith({ configDirectory: '/app' });
  expect(constructedUris).toEqual(['mongodb://127.0.0.1:27999/']);
  expect(mockClientConnect).toHaveBeenCalledTimes(1);
  expect(JSON.parse(session.env.LOWDEFY_TEST_CONNECTION_OVERRIDES)).toEqual({
    controls: { databaseUri: 'mongodb://127.0.0.1:27999/' },
    users: { databaseUri: 'mongodb://127.0.0.1:27999/' },
  });
  expect(session.client).toBeInstanceOf(MongoClient);
  await session.stop();
  expect(mockClientClose).toHaveBeenCalledTimes(1);
  expect(mockServerStop).toHaveBeenCalledTimes(1);
});

test('prepareSeeding refuses seeded tests against --url', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  context.options.url = 'http://localhost:3000';
  await expect(prepareSeeding({ context, seeds: [{ seed: { controls: [] } }] })).rejects.toThrow(
    'Seeded tests need a server this command started; --url targets a server whose connections it cannot redirect.'
  );
  expect(mockLoadMemoryMongo).not.toHaveBeenCalled();
});

test('prepareSeeding surfaces the install hint when the memory server is not installed', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  mockLoadMemoryMongo.mockRejectedValue(
    new Error(
      'Request tests with "seed" need an in-memory MongoDB. Install it: pnpm add -D mongodb-memory-server mongodb'
    )
  );
  await expect(prepareSeeding({ context, seeds: [{ seed: { controls: [] } }] })).rejects.toThrow(
    'Install it: pnpm add -D mongodb-memory-server mongodb'
  );
});

test('prepareSeeding loads fixtures and redirects the connections they seed too', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  const session = await prepareSeeding({
    context,
    seeds: [{ fixtures: ['base'], seed: { answers: [] } }, { fixtures: ['base', 'org-a'] }],
  });
  expect(mockReadFixture).toHaveBeenCalledTimes(2);
  expect(JSON.parse(session.env.LOWDEFY_TEST_CONNECTION_OVERRIDES)).toEqual({
    answers: { databaseUri: 'mongodb://127.0.0.1:27999/' },
    base_connection: { databaseUri: 'mongodb://127.0.0.1:27999/' },
    'org-a_connection': { databaseUri: 'mongodb://127.0.0.1:27999/' },
  });
  expect(session.fixtures.get('base').fixture.name).toEqual('base');
  expect(session.fixtures.get('org-a').fixture.name).toEqual('org-a');
  await session.stop();
});

test('prepareSeeding starts no memory server when the only fixture failed to load', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  mockReadFixture.mockRejectedValue(
    new Error('Fixture "nope" not found. Expected fixtures/nope.yaml.')
  );
  const session = await prepareSeeding({
    context,
    seeds: [{ fixtures: ['nope'] }],
  });
  expect(mockLoadMemoryMongo).not.toHaveBeenCalled();
  expect(session.client).toBeNull();
  expect(session.fixtures.get('nope')).toEqual({
    error: 'Fixture "nope" not found. Expected fixtures/nope.yaml.',
  });
});

test('prepareSeeding stops the memory server when the client cannot connect', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  mockClientConnect.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
  await expect(prepareSeeding({ context, seeds: [{ seed: { controls: [] } }] })).rejects.toThrow(
    'connect ECONNREFUSED'
  );
  // Without this the mongod process outlives the command.
  expect(mockServerStop).toHaveBeenCalledTimes(1);
});

test('prepareSeeding hands the session the ObjectId the seeder revives markers with', async () => {
  const { default: prepareSeeding } = await import('./prepareSeeding.js');
  const session = await prepareSeeding({ context, seeds: [{ seed: { controls: [] } }] });
  expect(session.ObjectId).toEqual({ tag: 'ObjectId' });
  expect(session.seeded).toEqual(new Map());
});
