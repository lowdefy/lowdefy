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

import createNetworkError from '../test/createNetworkError.js';
import createRequestQueue from './createRequestQueue.js';

function createMemoryQueueStore() {
  let rows = [];
  return {
    async add({ appId, item }) {
      rows.push({ ...item, appId, status: 'pending', error: null, attempts: 0 });
    },
    async list({ appId }) {
      return rows.filter((row) => row.appId === appId).map((row) => ({ ...row }));
    },
    async update({ attempts, error = null, id, status }) {
      rows = rows.map((row) => (row.id === id ? { ...row, attempts, error, status } : row));
    },
    async remove({ id }) {
      rows = rows.filter((row) => row.id !== id);
    },
    async removeFailed({ appId }) {
      rows = rows.filter((row) => !(row.appId === appId && row.status === 'failed'));
    },
    async removeApp({ appId }) {
      rows = rows.filter((row) => row.appId !== appId);
    },
  };
}

function createNetwork(online) {
  const listeners = new Set();
  return {
    isOnline: () => online,
    set(next) {
      online = next;
      listeners.forEach((listener) => listener(online));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function response(status, body = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function setup({ online = true, fetch = jest.fn(async () => response(200)) } = {}) {
  let next = 0;
  const networkStatus = createNetwork(online);
  const triggerAppEvent = jest.fn();
  const queue = createRequestQueue({
    appId: 'acme',
    fetch,
    networkStatus,
    newId: () => `q${(next += 1)}`,
    queueStore: createMemoryQueueStore(),
    tokenStore: { get: () => 'token' },
    triggerAppEvent,
  });
  return { fetch, networkStatus, queue, triggerAppEvent };
}

const call = (requestId) => ({
  body: { payload: { id: requestId } },
  buildId: 'b1',
  pageId: 'jobs',
  requestId,
  url: `https://acme.example.com/api/request/jobs/${requestId}`,
});

test('an offline request is kept and answers { queued: true, id }', async () => {
  const { queue, triggerAppEvent } = setup({ online: false });
  const send = jest.fn();
  await expect(queue.send({ ...call('save'), send })).resolves.toEqual({
    response: { queued: true, id: 'q1', message: 'Queued until the phone is back online.' },
  });
  expect(send).not.toHaveBeenCalled();
  expect(triggerAppEvent).toHaveBeenCalledWith({
    name: 'onRequestQueue',
    event: expect.objectContaining({ pending: 1, failed: 0, sent: 0 }),
  });
});

test('an online request sends at once, and is kept when the send fails for the network', async () => {
  const { queue } = setup();
  await expect(queue.send({ ...call('a'), send: async () => ({ response: 1 }) })).resolves.toEqual({
    response: 1,
  });
  await expect(
    queue.send({
      ...call('b'),
      send: async () => {
        throw createNetworkError();
      },
    })
  ).resolves.toEqual(
    expect.objectContaining({ response: expect.objectContaining({ queued: true }) })
  );
  expect((await queue.get()).pending).toBe(1);
});

test('a fault in the send path is thrown, not queued as waiting for the network', async () => {
  const { queue } = setup();
  const fault = new TypeError("Cannot read properties of undefined (reading 'json')");
  await expect(
    queue.send({
      ...call('b'),
      send: async () => {
        throw fault;
      },
    })
  ).rejects.toBe(fault);
  expect((await queue.get()).pending).toBe(0);
});

test('the queue replays in order when the phone comes back online, with the stored body and build', async () => {
  const { fetch, networkStatus, queue, triggerAppEvent } = setup({ online: false });
  await queue.send({ ...call('first'), send: jest.fn() });
  await queue.send({ ...call('second'), send: jest.fn() });
  queue.start();
  networkStatus.set(true);
  await queue.replay();
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    'https://acme.example.com/api/request/jobs/first',
    'https://acme.example.com/api/request/jobs/second',
  ]);
  expect(fetch.mock.calls[0][1].headers).toEqual(
    expect.objectContaining({ Authorization: 'Bearer token', 'x-lowdefy-build': 'b1' })
  );
  // The shell's fetch keeps the queued build instead of stamping the current one.
  expect(fetch.mock.calls[0][1].keepBuild).toBe(true);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ payload: { id: 'first' } });
  expect(await queue.get()).toEqual({ pending: 0, failed: 0, items: [] });
  expect(triggerAppEvent).toHaveBeenLastCalledWith({
    name: 'onRequestQueue',
    event: expect.objectContaining({ pending: 0, sent: 2 }),
  });
});

test('a refused request is marked failed with the server message, and the replay moves on', async () => {
  const fetch = jest
    .fn()
    .mockResolvedValueOnce(response(409, { message: 'The job was closed.' }))
    .mockResolvedValueOnce(response(200));
  const { networkStatus, queue } = setup({ online: false, fetch });
  await queue.send({ ...call('close'), send: jest.fn() });
  await queue.send({ ...call('note'), send: jest.fn() });
  networkStatus.set(true);
  await queue.replay();
  const summary = await queue.get();
  expect(summary.pending).toBe(0);
  expect(summary.failed).toBe(1);
  expect(summary.items[0]).toEqual(
    expect.objectContaining({ requestId: 'close', status: 'failed', error: 'The job was closed.' })
  );
});

test('a refused request keeps the message of the server error it carries', async () => {
  const fetch = jest.fn().mockResolvedValueOnce(
    response(400, {
      '~e': { name: 'RequestError', message: 'The job is closed.', isLowdefyError: true },
    })
  );
  const { networkStatus, queue } = setup({ online: false, fetch });
  await queue.send({ ...call('close'), send: jest.fn() });
  networkStatus.set(true);
  await queue.replay();
  expect((await queue.get()).items[0]).toEqual(
    expect.objectContaining({ status: 'failed', error: 'The job is closed.' })
  );
});

test('a network failure during the replay stops it and keeps the request pending', async () => {
  const fetch = jest.fn(async () => {
    throw createNetworkError();
  });
  const { networkStatus, queue } = setup({ online: false, fetch });
  await queue.send({ ...call('save'), send: jest.fn() });
  networkStatus.set(true);
  await queue.replay();
  expect((await queue.get()).pending).toBe(1);
});

test('retry sends failed requests again, and discard removes them', async () => {
  const fetch = jest.fn().mockResolvedValue(response(400, { message: 'Bad' }));
  const { networkStatus, queue } = setup({ online: false, fetch });
  await queue.send({ ...call('save'), send: jest.fn() });
  networkStatus.set(true);
  await queue.replay();
  expect((await queue.get()).failed).toBe(1);
  fetch.mockResolvedValue(response(200));
  await expect(queue.retry({ id: 'q1' })).resolves.toEqual({ pending: 0, failed: 0, items: [] });
  await queue.send({ ...call('again'), send: async () => response(200) });
  await expect(queue.discard({})).rejects.toThrow(
    'DiscardQueuedRequest requires "id", or "failed: true".'
  );
});
