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

import { Worker } from 'node:worker_threads';

import { afterEach, expect, test, vi } from 'vitest';

import createJourneyPool from './createJourneyPool.js';

// A stand-in for journeyWorker.js, on a real worker thread: each job's params say what it does.
// echo answers its thread id; call calls the host's `method` and answers the reply; wait answers
// after `ms`; exit stops the thread mid-journey.
const WORKER = `
const { parentPort, threadId } = require('node:worker_threads');
const pending = new Map();
let nextCall = 0;
function call(method, args) {
  nextCall += 1;
  const callId = nextCall;
  return new Promise((resolve, reject) => {
    pending.set(callId, { resolve, reject });
    parentPort.postMessage({ type: 'call', callId, method, args });
  });
}
parentPort.on('message', async (message) => {
  if (message.type === 'answer') {
    const waiting = pending.get(message.callId);
    pending.delete(message.callId);
    if (message.error) waiting.reject(new Error(message.error.message));
    else waiting.resolve(message.value);
    return;
  }
  const { id, params } = message;
  try {
    if (params.kind === 'exit') process.exit(3);
    if (params.kind === 'wait') await new Promise((resolve) => setTimeout(resolve, params.ms));
    const value = params.kind === 'call' ? await call(params.method, params.args) : null;
    parentPort.postMessage({ type: 'result', id, value: { threadId, value, mutant: message.mutant } });
  } catch (error) {
    parentPort.postMessage({ type: 'result', id, error: { message: error.message } });
  }
});
`;

const pools = [];

function createPool(options) {
  const pool = createJourneyPool({
    size: 2,
    readSignature: () => 'a',
    start: () => new Worker(WORKER, { eval: true }),
    ...options,
  });
  pools.push(pool);
  return pool;
}

afterEach(async () => {
  await Promise.all(pools.splice(0).map((pool) => pool.close()));
});

test('createJourneyPool runs a journey on a thread and answers its calls from the journey host', async () => {
  const buildPage = vi.fn(async ({ pageId }) => ({ result: true, built: `${pageId}-1` }));
  const pool = createPool();
  const answer = await pool.run({
    params: { kind: 'call', method: 'buildPage', args: { pageId: 'home' } },
    mutant: { key: 'k1' },
    host: { buildPage },
  });
  expect(answer.value).toEqual({ result: true, built: 'home-1' });
  expect(answer.mutant).toEqual({ key: 'k1' });
  expect(buildPage).toHaveBeenCalledWith({ pageId: 'home' }, { threadId: answer.threadId });
  expect(pool.started).toBe(1);
});

test('createJourneyPool fails a call its journey host does not answer, and the journey with it', async () => {
  const pool = createPool();
  await expect(
    pool.run({ params: { kind: 'call', method: 'dataStoreUri', args: {} }, host: {} })
  ).rejects.toThrow('The journey thread called "dataStoreUri", which its journey does not answer.');
});

test('createJourneyPool starts a thread only when every thread is busy, up to its size, and a journey past it waits', async () => {
  const pool = createPool({ size: 2 });
  const first = await pool.run({ params: { kind: 'echo' }, host: {} });
  const second = await pool.run({ params: { kind: 'echo' }, host: {} });
  // One at a time: the first thread was free again for the second journey.
  expect(second.threadId).toBe(first.threadId);
  expect(pool.started).toBe(1);
  const answers = await Promise.all([
    pool.run({ params: { kind: 'wait', ms: 200 }, host: {} }),
    pool.run({ params: { kind: 'wait', ms: 200 }, host: {} }),
    pool.run({ params: { kind: 'echo' }, host: {} }),
  ]);
  expect(pool.started).toBe(2);
  expect(new Set(answers.map((answer) => answer.threadId)).size).toBe(2);
});

test('createJourneyPool replaces an idle thread started on another plugin signature before it takes a journey', async () => {
  let signature = 'a';
  const onThreadStopped = vi.fn();
  const pool = createPool({ readSignature: () => signature, onThreadStopped });
  const before = await pool.run({ params: { kind: 'echo' }, host: {} });
  signature = 'b';
  const after = await pool.run({ params: { kind: 'echo' }, host: {} });
  expect(after.threadId).not.toBe(before.threadId);
  expect(pool.started).toBe(2);
  await vi.waitFor(() => {
    expect(onThreadStopped).toHaveBeenCalledWith({ threadId: before.threadId });
  });
});

test('createJourneyPool fails the journey a thread was running when it stops, and the next journey starts a new thread', async () => {
  const onThreadStopped = vi.fn();
  const pool = createPool({ onThreadStopped });
  const first = await pool.run({ params: { kind: 'echo' }, host: {} });
  await expect(pool.run({ params: { kind: 'exit' }, host: {} })).rejects.toThrow(
    'The journey thread running this journey stopped: it exited with code 3'
  );
  expect(onThreadStopped).toHaveBeenCalledWith({ threadId: first.threadId });
  const next = await pool.run({ params: { kind: 'echo' }, host: {} });
  expect(next.threadId).not.toBe(first.threadId);
});

test('createJourneyPool stops a thread that has had no journey for idleMs', async () => {
  const onThreadStopped = vi.fn();
  const pool = createPool({ idleMs: 50, onThreadStopped });
  const { threadId } = await pool.run({ params: { kind: 'echo' }, host: {} });
  await vi.waitFor(() => {
    expect(onThreadStopped).toHaveBeenCalledWith({ threadId });
  });
  expect(pool.running).toBe(0);
});

test('createJourneyPool fails a journey whose params cannot be sent, and frees its thread', async () => {
  const pool = createPool({ size: 1 });
  await expect(
    pool.run({ params: { kind: 'echo', notCloneable: () => {} }, host: {} })
  ).rejects.toThrow();
  const next = await pool.run({ params: { kind: 'echo' }, host: {} });
  expect(next.value).toBeNull();
});

test('createJourneyPool refuses a journey once it has closed, and fails the journeys still waiting', async () => {
  const pool = createPool({ size: 1 });
  const running = expect(
    pool.run({ params: { kind: 'wait', ms: 200 }, host: {} })
  ).rejects.toThrow();
  const waiting = expect(pool.run({ params: { kind: 'echo' }, host: {} })).rejects.toThrow(
    'The journey pool has closed.'
  );
  await pool.close();
  await waiting;
  await running;
  await expect(pool.run({ params: { kind: 'echo' }, host: {} })).rejects.toThrow(
    'The journey pool has closed.'
  );
});
