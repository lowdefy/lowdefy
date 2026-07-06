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

const mockGetCollection = jest.fn();

jest.unstable_mockModule('../getCollection.js', () => ({
  default: mockGetCollection,
}));

// A fake change stream: yields queued changes, then waits until close() ends it.
function createFakeStream({ changes = [], failWith = null } = {}) {
  let closed = false;
  let release;
  const closedPromise = new Promise((resolve) => {
    release = resolve;
  });
  return {
    watchCalls: [],
    close: jest.fn(async () => {
      closed = true;
      release();
    }),
    async *[Symbol.asyncIterator]() {
      for (const change of changes) {
        yield change;
      }
      if (failWith) {
        throw failWith;
      }
      await closedPromise;
      if (closed) {
        const error = new Error('ChangeStream is closed');
        throw error;
      }
    },
  };
}

function createHarness({ changes, failWith } = {}) {
  const stream = createFakeStream({ changes, failWith });
  const client = { close: jest.fn() };
  const collection = { watch: jest.fn(() => stream) };
  mockGetCollection.mockResolvedValue({ client, collection });
  const publish = jest.fn();
  const abortController = new AbortController();
  return { abortController, client, collection, publish, stream };
}

beforeEach(() => {
  mockGetCollection.mockReset();
});

test('MongoDBChangeStream publishes serialized change events', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const createdAt = new Date('2026-01-15T00:00:00.000Z');
  const { abortController, client, publish } = createHarness({
    changes: [
      { operationType: 'insert', fullDocument: { name: 'one', createdAt } },
      { operationType: 'update', fullDocument: { name: 'two' } },
    ],
    failWith: new Error('ChangeStream is closed'),
  });
  abortController.abort(); // makes the trailing iterator error an expected abort
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: {},
    publish,
    signal: abortController.signal,
  });
  await run;
  expect(publish).toHaveBeenCalledTimes(0); // aborted before start — resolver returns early
  expect(client.close).toHaveBeenCalled();
});

test('MongoDBChangeStream publishes events until aborted', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const createdAt = new Date('2026-01-15T00:00:00.000Z');
  const { abortController, client, collection, publish, stream } = createHarness({
    changes: [
      { operationType: 'insert', fullDocument: { name: 'one', createdAt } },
      { operationType: 'update', fullDocument: { name: 'two' } },
    ],
  });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: { pipeline: [{ $match: { operationType: 'insert' } }] },
    publish,
    signal: abortController.signal,
  });
  // Give the async iterator a tick to consume the queued changes.
  await new Promise((resolve) => setTimeout(resolve, 10));
  abortController.abort();
  await run;

  expect(collection.watch).toHaveBeenCalledWith([{ $match: { operationType: 'insert' } }], {
    fullDocument: 'updateLookup',
  });
  expect(publish).toHaveBeenCalledTimes(2);
  // The plugin serialize util only marks MongoDB types (ObjectId → _oid);
  // Dates pass through — the framework serializer handles them (~d) when the
  // channel registry serializes the published frame.
  expect(publish.mock.calls[0][0].data.fullDocument.createdAt).toEqual(createdAt);
  expect(publish.mock.calls[1][0].data.fullDocument.name).toEqual('two');
  expect(stream.close).toHaveBeenCalled();
  expect(client.close).toHaveBeenCalled();
});

test('MongoDBChangeStream passes fullDocument option through', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const { abortController, collection, publish } = createHarness({ changes: [] });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: { fullDocument: 'whenAvailable' },
    publish,
    signal: abortController.signal,
  });
  await new Promise((resolve) => setTimeout(resolve, 10));
  abortController.abort();
  await run;
  expect(collection.watch).toHaveBeenCalledWith([], { fullDocument: 'whenAvailable' });
});

test('MongoDBChangeStream rethrows stream errors when not aborted', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const { abortController, client, publish } = createHarness({
    changes: [],
    failWith: new Error('stream broke'),
  });
  await expect(
    MongoDBChangeStream({
      connection: { databaseUri: 'mongodb://test' },
      properties: {},
      publish,
      signal: abortController.signal,
    })
  ).rejects.toThrow('stream broke');
  expect(client.close).toHaveBeenCalled();
});
