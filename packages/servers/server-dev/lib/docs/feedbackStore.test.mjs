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

const { default: feedbackStore } = await import('./feedbackStore.js');

// feedbackStore keeps its queue and waiters at module scope — reset between
// tests to keep them independent.
afterEach(() => {
  feedbackStore.clear();
});

test('push adds a batch to the queue, visible via count and peek', () => {
  feedbackStore.push({ batchId: 'a' });
  expect(feedbackStore.count()).toEqual(1);
  expect(feedbackStore.peek()).toEqual([{ batchId: 'a' }]);
});

test('peek returns a copy, not the live queue', () => {
  feedbackStore.push({ batchId: 'a' });
  const copy = feedbackStore.peek();
  copy.push({ batchId: 'intruder' });
  expect(feedbackStore.count()).toEqual(1);
});

test('consumeAll drains the queue and empties it', () => {
  feedbackStore.push({ batchId: 'a' });
  feedbackStore.push({ batchId: 'b' });
  const drained = feedbackStore.consumeAll();
  expect(drained).toEqual([{ batchId: 'a' }, { batchId: 'b' }]);
  expect(feedbackStore.count()).toEqual(0);
});

test('waitForNext resolves immediately when the queue already has entries', async () => {
  feedbackStore.push({ batchId: 'a' });
  const result = await feedbackStore.waitForNext({ timeoutMs: 1000 });
  expect(result).toEqual([{ batchId: 'a' }]);
  expect(feedbackStore.count()).toEqual(0);
});

test('push delivers straight to a pending waiter instead of queueing', async () => {
  const promise = feedbackStore.waitForNext({ timeoutMs: 1000 });
  // Give waitForNext a tick to register its waiter before pushing.
  await new Promise((resolve) => setImmediate(resolve));
  feedbackStore.push({ batchId: 'a' });

  const result = await promise;
  expect(result).toEqual([{ batchId: 'a' }]);
  // No queue residue left behind — the batch went straight to the waiter.
  expect(feedbackStore.count()).toEqual(0);
});

test('waitForNext resolves with an empty array on timeout', async () => {
  const result = await feedbackStore.waitForNext({ timeoutMs: 10 });
  expect(result).toEqual([]);
});

test('two racing waitForNext calls and one push deliver to exactly one of them', async () => {
  const first = feedbackStore.waitForNext({ timeoutMs: 1000 });
  const second = feedbackStore.waitForNext({ timeoutMs: 1000 });
  await new Promise((resolve) => setImmediate(resolve));

  feedbackStore.push({ batchId: 'only-one' });

  const [firstResult, secondResult] = await Promise.all([
    first,
    Promise.race([second, new Promise((resolve) => setTimeout(() => resolve('pending'), 50))]),
  ]);

  // Exactly one of the two waiters received the batch; the other is still
  // pending (would only resolve on its own timeout, which we don't wait out).
  expect(firstResult).toEqual([{ batchId: 'only-one' }]);
  expect(secondResult).toEqual('pending');
});

test('push caps the queue at 50 entries, dropping the oldest', () => {
  for (let i = 0; i < 55; i += 1) {
    feedbackStore.push({ batchId: `batch-${i}` });
  }
  expect(feedbackStore.count()).toEqual(50);
  const remaining = feedbackStore.peek();
  expect(remaining[0]).toEqual({ batchId: 'batch-5' });
  expect(remaining[remaining.length - 1]).toEqual({ batchId: 'batch-54' });
});
