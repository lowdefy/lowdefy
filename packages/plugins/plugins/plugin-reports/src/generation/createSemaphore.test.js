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

import createSemaphore from './createSemaphore.js';

const busy = ({ active, queued }) => new Error(`busy: ${active} running, ${queued} queued`);

// Whether a promise has settled by the next macrotask.
async function settled(promise) {
  let done = false;
  promise.then(
    () => {
      done = true;
    },
    () => {
      done = true;
    }
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  return done;
}

test('grants slots up to maxConcurrent immediately and queues the rest', async () => {
  const semaphore = createSemaphore({ maxConcurrent: 2, maxQueued: 8 });
  await semaphore.acquire({ busy });
  await semaphore.acquire({ busy });
  const third = semaphore.acquire({ busy });
  expect(await settled(third)).toBe(false);
  semaphore.release();
  await expect(third).resolves.toBeUndefined();
});

test('rejects with the busy error once the queue is full', async () => {
  const semaphore = createSemaphore({ maxConcurrent: 1, maxQueued: 1 });
  await semaphore.acquire({ busy });
  const queued = semaphore.acquire({ busy });
  await expect(semaphore.acquire({ busy })).rejects.toThrow('busy: 1 running, 1 queued');
  semaphore.release();
  await queued;
});

test('a waiter aborted while queued leaves the queue and rejects with the reason', async () => {
  const semaphore = createSemaphore({ maxConcurrent: 1, maxQueued: 1 });
  await semaphore.acquire({ busy });
  const controller = new AbortController();
  const waiting = semaphore.acquire({ signal: controller.signal, busy });
  controller.abort(new Error('deadline'));
  await expect(waiting).rejects.toThrow('deadline');
  // Its queue place is free again, so another caller is queued rather than refused.
  const next = semaphore.acquire({ busy });
  expect(await settled(next)).toBe(false);
  semaphore.release();
  await expect(next).resolves.toBeUndefined();
});

test('an already-aborted signal never joins the queue', async () => {
  const semaphore = createSemaphore({ maxConcurrent: 1, maxQueued: 1 });
  await semaphore.acquire({ busy });
  const controller = new AbortController();
  controller.abort(new Error('too late'));
  await expect(semaphore.acquire({ signal: controller.signal, busy })).rejects.toThrow('too late');
  // Releasing the only slot must not hand it to the aborted waiter.
  semaphore.release();
  await expect(semaphore.acquire({ busy })).resolves.toBeUndefined();
});

test('release hands the slot straight to the next waiter in order', async () => {
  const semaphore = createSemaphore({ maxConcurrent: 1, maxQueued: 2 });
  await semaphore.acquire({ busy });
  const order = [];
  const first = semaphore.acquire({ busy }).then(() => order.push('first'));
  const second = semaphore.acquire({ busy }).then(() => order.push('second'));
  semaphore.release();
  await first;
  semaphore.release();
  await second;
  expect(order).toEqual(['first', 'second']);
});
