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

import { vi, beforeEach, expect, test } from 'vitest';
import { MongoNetworkError, MongoServerError } from 'mongodb';

const mockGetCollection = vi.fn();

vi.doMock('../getCollection.js', () => ({
  default: mockGetCollection,
}));

// A fake change stream: yields queued changes, then waits until close() ends it.
function createFakeStream({ changes = [], failWith = null, onIterate = null } = {}) {
  let closed = false;
  let release;
  const closedPromise = new Promise((resolve) => {
    release = resolve;
  });
  const listeners = {};
  const stream = {
    on: vi.fn((event, listener) => {
      listeners[event] = listener;
    }),
    emit: (event, value) => listeners[event]?.(value),
    close: vi.fn(async () => {
      closed = true;
      release();
    }),
    async *[Symbol.asyncIterator]() {
      onIterate?.(stream);
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
  return stream;
}

function createHarness({ changes, failWith, streams } = {}) {
  const stream = createFakeStream({ changes, failWith });
  // Each watch call opens the next stream; the last one repeats.
  const queue = streams ?? [stream];
  let opened = 0;
  const collection = {
    watch: vi.fn(() => {
      const next = queue[Math.min(opened, queue.length - 1)];
      opened += 1;
      return next;
    }),
  };
  // getCollection resolves { client, collection, logCollection } — the
  // resolver destructures collection off it.
  mockGetCollection.mockResolvedValue({ collection });
  const publish = vi.fn();
  const abortController = new AbortController();
  return { abortController, collection, publish, stream: queue[0] };
}

beforeEach(() => {
  mockGetCollection.mockReset();
});

test('MongoDBChangeStream publishes serialized change events', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const createdAt = new Date('2026-01-15T00:00:00.000Z');
  const { abortController, collection, publish } = createHarness({
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
  expect(collection.watch).not.toHaveBeenCalled();
});

test('MongoDBChangeStream publishes events until aborted', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const createdAt = new Date('2026-01-15T00:00:00.000Z');
  const { abortController, collection, publish, stream } = createHarness({
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
  const { abortController, publish, stream } = createHarness({
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
  expect(stream.close).toHaveBeenCalled();
});

function serverError(code) {
  return new MongoServerError({ code, errmsg: `server error ${code}` });
}

test('MongoDBChangeStream resumes after the last change on a replica set election', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const first = createFakeStream({
    changes: [
      { _id: { _data: 'token-1' }, operationType: 'insert', fullDocument: { name: 'one' } },
    ],
    failWith: serverError(11602),
  });
  const second = createFakeStream({
    changes: [
      { _id: { _data: 'token-2' }, operationType: 'insert', fullDocument: { name: 'two' } },
    ],
  });
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: { pipeline: [{ $match: { operationType: 'insert' } }] },
    publish,
    signal: abortController.signal,
  });
  // The first retry waits 0.5 s.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  abortController.abort();
  await expect(run).resolves.toBeUndefined();

  expect(collection.watch).toHaveBeenCalledTimes(2);
  expect(collection.watch.mock.calls[0]).toEqual([
    [{ $match: { operationType: 'insert' } }],
    { fullDocument: 'updateLookup' },
  ]);
  expect(collection.watch.mock.calls[1]).toEqual([
    [{ $match: { operationType: 'insert' } }],
    { fullDocument: 'updateLookup', resumeAfter: { _data: 'token-1' } },
  ]);
  expect(first.close).toHaveBeenCalled();
  expect(publish).toHaveBeenCalledTimes(2);
  expect(publish.mock.calls[1][0].data.fullDocument.name).toEqual('two');
});

test('MongoDBChangeStream reopens fresh when no change came before a network error', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const first = createFakeStream({ failWith: new MongoNetworkError('connection reset') });
  const second = createFakeStream();
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: {},
    publish,
    signal: abortController.signal,
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  abortController.abort();
  await expect(run).resolves.toBeUndefined();
  expect(collection.watch).toHaveBeenCalledTimes(2);
  expect(collection.watch.mock.calls[1]).toEqual([[], { fullDocument: 'updateLookup' }]);
});

test('MongoDBChangeStream resumes on an error labelled ResumableChangeStreamError', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const labelled = serverError(1);
  labelled.addErrorLabel('ResumableChangeStreamError');
  const first = createFakeStream({ failWith: labelled });
  const second = createFakeStream();
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: {},
    publish,
    signal: abortController.signal,
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  abortController.abort();
  await expect(run).resolves.toBeUndefined();
  expect(collection.watch).toHaveBeenCalledTimes(2);
});

test('MongoDBChangeStream throws when a resume finds the history lost', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const first = createFakeStream({
    changes: [{ _id: { _data: 'token-1' }, operationType: 'insert' }],
    failWith: serverError(11602),
  });
  const second = createFakeStream({ failWith: serverError(286) });
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const error = await MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test', collection: 'items' },
    properties: {},
    publish,
    signal: abortController.signal,
  }).catch((e) => e);
  expect(collection.watch).toHaveBeenCalledTimes(2);
  expect(error.code).toEqual(286);
  expect(second.close).toHaveBeenCalled();
});

test('MongoDBChangeStream does not resume a non-resumable server error', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const { abortController, collection, publish } = createHarness({ failWith: serverError(13) });
  const error = await MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test', collection: 'items' },
    properties: {},
    publish,
    signal: abortController.signal,
  }).catch((e) => e);
  expect(collection.watch).toHaveBeenCalledTimes(1);
  expect(error.code).toEqual(13);
});

test('MongoDBChangeStream gives up when the stream keeps failing for 30 s', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(0);
  const first = createFakeStream({ failWith: serverError(11602) });
  const second = createFakeStream({
    failWith: serverError(11602),
    onIterate: () => vi.setSystemTime(31000),
  });
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const error = await MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test', collection: 'items' },
    properties: {},
    publish,
    signal: abortController.signal,
  }).catch((e) => e);
  vi.useRealTimers();
  expect(collection.watch).toHaveBeenCalledTimes(2);
  expect(error.code).toEqual(11602);
});

test('MongoDBChangeStream keeps the retry window when a reopened stream fails right after reaching the server', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(0);
  const first = createFakeStream({ failWith: serverError(11602) });
  // A flapping primary: the aggregate answers, then the getMore fails.
  const second = createFakeStream({
    failWith: serverError(11602),
    onIterate: (stream) => {
      vi.setSystemTime(31000);
      stream.emit('resumeTokenChanged', { _data: 'token-2' });
    },
  });
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const error = await MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test', collection: 'items' },
    properties: {},
    publish,
    signal: abortController.signal,
  }).catch((e) => e);
  vi.useRealTimers();
  expect(collection.watch).toHaveBeenCalledTimes(2);
  expect(error.code).toEqual(11602);
});

test('MongoDBChangeStream starts a new retry window after a stream that ran healthy fails', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(0);
  const first = createFakeStream({ failWith: serverError(11602) });
  // The server answers it for 31 s, then it fails.
  const second = createFakeStream({
    failWith: serverError(11602),
    onIterate: (stream) => {
      vi.setSystemTime(1000);
      stream.emit('resumeTokenChanged', { _data: 'token-2' });
      vi.setSystemTime(32000);
      stream.emit('resumeTokenChanged', { _data: 'token-3' });
    },
  });
  const third = createFakeStream();
  const { abortController, collection, publish } = createHarness({
    streams: [first, second, third],
  });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: {},
    publish,
    signal: abortController.signal,
  });
  // Retries wait 0.5 s, then (with the window reset) 0.5 s again.
  await new Promise((resolve) => setTimeout(resolve, 1600));
  abortController.abort();
  await expect(run).resolves.toBeUndefined();
  vi.useRealTimers();
  expect(collection.watch).toHaveBeenCalledTimes(3);
});

test('MongoDBChangeStream keeps the retry window when the driver blocked after the last answer', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(0);
  const first = createFakeStream({ failWith: serverError(11602) });
  // Answered once, then the driver waits 31 s for a primary and fails.
  const second = createFakeStream({
    failWith: serverError(11602),
    onIterate: (stream) => {
      vi.setSystemTime(1000);
      stream.emit('resumeTokenChanged', { _data: 'token-2' });
      vi.setSystemTime(32000);
    },
  });
  const { abortController, collection, publish } = createHarness({ streams: [first, second] });
  const error = await MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test', collection: 'items' },
    properties: {},
    publish,
    signal: abortController.signal,
  }).catch((e) => e);
  vi.useRealTimers();
  expect(collection.watch).toHaveBeenCalledTimes(2);
  expect(error.code).toEqual(11602);
});

test('MongoDBChangeStream stops waiting to retry when aborted', async () => {
  const { default: MongoDBChangeStream } = await import('./MongoDBChangeStream.js');
  const { abortController, collection, publish } = createHarness({
    failWith: serverError(11602),
  });
  const run = MongoDBChangeStream({
    connection: { databaseUri: 'mongodb://test' },
    properties: {},
    publish,
    signal: abortController.signal,
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  abortController.abort();
  await expect(run).resolves.toBeUndefined();
  expect(collection.watch).toHaveBeenCalledTimes(1);
});
