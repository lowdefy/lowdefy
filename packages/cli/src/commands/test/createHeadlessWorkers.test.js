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

import { EventEmitter } from 'node:events';
import { expect, test } from 'vitest';

import createHeadlessWorkers from './createHeadlessWorkers.js';

// A stand-in worker thread: it keeps the jobs posted to it, and answer() replies to the oldest.
function createFakeStart() {
  const workers = [];
  function start(workerData) {
    const worker = new EventEmitter();
    worker.workerData = workerData;
    worker.jobs = [];
    worker.closed = false;
    worker.terminated = false;
    worker.postMessage = (message) => {
      if (message.type === 'close') {
        worker.closed = true;
        setImmediate(() => worker.emit('message', { type: 'closed' }));
        return;
      }
      worker.jobs.push(message);
    };
    worker.terminate = async () => {
      worker.terminated = true;
      worker.emit('exit', 1);
    };
    worker.answer = (reply) => {
      const job = worker.jobs.shift();
      worker.emit('message', { id: job.id, ...reply(job) });
    };
    workers.push(worker);
    return worker;
  }
  return { start, workers };
}

function tick() {
  return new Promise((resolve) => setImmediate(resolve));
}

test('starts a thread only when every started one is busy, up to size', async () => {
  const fake = createFakeStart();
  const pool = createHeadlessWorkers({ size: 2, workerData: { secrets: {} }, start: fake.start });
  expect(pool.started).toBe(0);
  const first = pool.run({ item: { name: 'a' }, repeat: 1 });
  expect(pool.started).toBe(1);
  expect(fake.workers[0].workerData).toEqual({ secrets: {} });
  fake.workers[0].answer((job) => ({ result: { name: job.item.name, passed: true } }));
  await expect(first).resolves.toEqual({ name: 'a', passed: true });
  // The first thread is free again, so the next journey takes it.
  const second = pool.run({ item: { name: 'b' }, repeat: 2 });
  expect(pool.started).toBe(1);
  expect(fake.workers[0].jobs).toEqual([{ id: 2, item: { name: 'b' }, repeat: 2 }]);
  const third = pool.run({ item: { name: 'c' }, repeat: 1 });
  expect(pool.started).toBe(2);
  fake.workers[1].answer(() => ({ result: { name: 'c' } }));
  fake.workers[0].answer(() => ({ result: { name: 'b' } }));
  await expect(third).resolves.toEqual({ name: 'c' });
  await expect(second).resolves.toEqual({ name: 'b' });
  await pool.close();
});

test('two journeys started in the same tick take two threads', async () => {
  const fake = createFakeStart();
  const pool = createHeadlessWorkers({ size: 3, workerData: {}, start: fake.start });
  const first = pool.run({ item: { name: 'a' }, repeat: 1 });
  fake.workers[0].answer(() => ({ result: 'a' }));
  await first;
  const runs = [
    pool.run({ item: { name: 'b' }, repeat: 1 }),
    pool.run({ item: { name: 'c' }, repeat: 1 }),
  ];
  expect(pool.started).toBe(2);
  expect(fake.workers.map((worker) => worker.jobs.length)).toEqual([1, 1]);
  fake.workers.forEach((worker) => worker.answer((job) => ({ result: job.item.name })));
  await expect(Promise.all(runs)).resolves.toEqual(['b', 'c']);
  await pool.close();
});

test('a journey that finds every thread busy waits for the first free one', async () => {
  const fake = createFakeStart();
  const pool = createHeadlessWorkers({ size: 1, workerData: {}, start: fake.start });
  const first = pool.run({ item: { name: 'a' }, repeat: 1 });
  const second = pool.run({ item: { name: 'b' }, repeat: 1 });
  expect(pool.started).toBe(1);
  expect(fake.workers[0].jobs.map((job) => job.item.name)).toEqual(['a']);
  fake.workers[0].answer(() => ({ result: 'a' }));
  await first;
  expect(fake.workers[0].jobs.map((job) => job.item.name)).toEqual(['b']);
  fake.workers[0].answer(() => ({ result: 'b' }));
  await expect(second).resolves.toBe('b');
  await pool.close();
});

test('throws what the run threw in the thread, with its stack', async () => {
  const fake = createFakeStart();
  const pool = createHeadlessWorkers({ size: 1, workerData: {}, start: fake.start });
  const run = pool.run({ item: {}, repeat: 1 });
  fake.workers[0].answer(() => ({ error: { message: 'boom', stack: 'Error: boom\n    at here' } }));
  const error = await run.catch((caught) => caught);
  expect(error.message).toBe('boom');
  expect(error.stack).toBe('Error: boom\n    at here');
  await pool.close();
});

test('a thread that stops fails its journey, and the next journey starts a new thread', async () => {
  const fake = createFakeStart();
  const pool = createHeadlessWorkers({ size: 1, workerData: {}, start: fake.start });
  const first = pool.run({ item: { name: 'a' }, repeat: 1 });
  const waiting = pool.run({ item: { name: 'b' }, repeat: 1 });
  fake.workers[0].emit('error', new Error('out of memory'));
  fake.workers[0].emit('exit', 1);
  await expect(first).rejects.toThrow(
    'The worker thread running this journey stopped: out of memory'
  );
  // The waiting journey took a new thread in the stopped one's place.
  expect(pool.started).toBe(2);
  fake.workers[1].answer(() => ({ result: 'b' }));
  await expect(waiting).resolves.toBe('b');
  await pool.close();
});

test('close() closes each thread before it stops it, and refuses later journeys', async () => {
  const fake = createFakeStart();
  const pool = createHeadlessWorkers({ size: 2, workerData: {}, start: fake.start });
  const runs = [pool.run({ item: {}, repeat: 1 }), pool.run({ item: {}, repeat: 1 })];
  fake.workers.forEach((worker) => worker.answer(() => ({ result: 'done' })));
  await Promise.all(runs);
  await pool.close();
  expect(fake.workers.map((worker) => [worker.closed, worker.terminated])).toEqual([
    [true, true],
    [true, true],
  ]);
  await expect(pool.run({ item: {}, repeat: 1 })).rejects.toThrow(
    'The run has closed its worker threads.'
  );
  await tick();
});
