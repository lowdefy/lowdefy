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

// Module-level FIFO queue of annotation batches posted by the dev browser
// overlay (src/routes/feedback.js), drained by a Claude Code Stop hook
// polling src/routes/feedbackPending.js. Mirrors clientErrorStore.js (ring
// buffer) blended with tabChannel.js (waiter registry + timeout race): a
// consumer can either poll (peek/consumeAll) or long-poll (waitForNext) so
// the hook does not have to busy-loop while waiting for a developer to draw
// an annotation.
const MAX_ENTRIES = 50;

let queue = [];
let waiters = [];

function push(batch) {
  // A waiter parked in waitForNext takes priority over queueing — deliver
  // straight to the oldest pending call instead of making it wait out its
  // own timeout only to then drain the queue.
  if (waiters.length > 0) {
    const waiter = waiters.shift();
    clearTimeout(waiter.timer);
    waiter.resolve([batch]);
    return;
  }
  queue.push(batch);
  if (queue.length > MAX_ENTRIES) {
    // Drop the oldest — this is a live-session debugging aid, not a durable
    // log, so losing the oldest unconsumed batch under backpressure is fine.
    queue.shift();
  }
}

function waitForNext({ timeoutMs = 30000 } = {}) {
  if (queue.length > 0) {
    return Promise.resolve(consumeAll());
  }
  return new Promise((resolve) => {
    const waiter = {
      resolve,
      timer: undefined,
    };
    waiter.timer = setTimeout(() => {
      waiters = waiters.filter((entry) => entry !== waiter);
      resolve([]);
    }, timeoutMs);
    waiters.push(waiter);
  });
}

function consumeAll() {
  return queue.splice(0, queue.length);
}

function peek() {
  return [...queue];
}

function count() {
  return queue.length;
}

// Test-only: resets module state between tests. Also clears any parked
// waiters so a test's setTimeout doesn't fire (and mutate state) after the
// test that created it has already finished.
function clear() {
  waiters.forEach((waiter) => clearTimeout(waiter.timer));
  waiters = [];
  queue = [];
}

export default { push, waitForNext, consumeAll, peek, count, clear };
