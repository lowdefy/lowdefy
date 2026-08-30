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
  constructedUris = [];
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
  });
});

test('prepareRequestTests returns an empty env and no client when nothing is seeded', async () => {
  const { default: prepareRequestTests } = await import('./prepareRequestTests.js');
  const session = await prepareRequestTests({
    context,
    items: [{ test: { name: 'a' } }, { filePath: 'f', error: 'bad' }],
  });
  expect(session.env).toEqual({});
  expect(session.client).toBeNull();
  expect(mockLoadMemoryMongo).not.toHaveBeenCalled();
  await session.stop();
});

test('prepareRequestTests starts a memory server and builds overrides for every seeded connection', async () => {
  const { default: prepareRequestTests } = await import('./prepareRequestTests.js');
  const session = await prepareRequestTests({
    context,
    items: [
      { test: { name: 'a', seed: { controls: [], users: [] } } },
      { test: { name: 'b', seed: { controls: [] } } },
    ],
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

test('prepareRequestTests refuses seeded tests against --url', async () => {
  const { default: prepareRequestTests } = await import('./prepareRequestTests.js');
  context.options.url = 'http://localhost:3000';
  await expect(
    prepareRequestTests({ context, items: [{ test: { name: 'a', seed: { controls: [] } } }] })
  ).rejects.toThrow(
    'Seeded request tests need a server this command started; --url targets a server whose connections it cannot redirect.'
  );
  expect(mockLoadMemoryMongo).not.toHaveBeenCalled();
});

test('prepareRequestTests surfaces the install hint when the memory server is not installed', async () => {
  const { default: prepareRequestTests } = await import('./prepareRequestTests.js');
  mockLoadMemoryMongo.mockRejectedValue(
    new Error(
      'Request tests with "seed" need an in-memory MongoDB. Install it: pnpm add -D mongodb-memory-server mongodb'
    )
  );
  await expect(
    prepareRequestTests({ context, items: [{ test: { name: 'a', seed: { controls: [] } } }] })
  ).rejects.toThrow('Install it: pnpm add -D mongodb-memory-server mongodb');
});
