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

// A promise-chain semaphore with a bounded FIFO queue and no dependency.
//
// `acquire` resolves when a slot is free; `release` hands the slot straight to
// the next waiter, so `active` only drops when nobody is waiting. The queue is
// bounded because an unbounded one only moves a burst problem: every queued
// caller holds an open connection and its parsed request body until its own
// deadline, and the ones at the back wait past any useful deadline anyway. Past
// the bound, `acquire` rejects with the caller's busy error.
//
// A waiter whose `signal` aborts while queued leaves the queue and rejects with
// the abort reason. Without that, a deadline that expires in the queue would
// still take a slot later and run work nobody is waiting for — and the timed-out
// waiters would keep the queue full for callers who could still be served.
function createSemaphore({ maxConcurrent, maxQueued }) {
  let active = 0;
  const waiters = [];

  function acquire({ signal, busy } = {}) {
    if (active < maxConcurrent) {
      active += 1;
      return Promise.resolve();
    }
    if (waiters.length >= maxQueued) {
      return Promise.reject(busy({ active, queued: waiters.length }));
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        grant: () => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        },
      };
      function onAbort() {
        const index = waiters.indexOf(waiter);
        if (index !== -1) waiters.splice(index, 1);
        reject(signal.reason);
      }
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      signal?.addEventListener('abort', onAbort, { once: true });
      waiters.push(waiter);
    });
  }

  function release() {
    const next = waiters.shift();
    if (next) {
      next.grant();
    } else {
      active -= 1;
    }
  }

  return { acquire, release };
}

export default createSemaphore;
