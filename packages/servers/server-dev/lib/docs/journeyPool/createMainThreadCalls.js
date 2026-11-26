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

// Calls from a journey worker thread to the main thread over `port` (the thread's parentPort):
// call(method, args) posts { type: 'call', callId, method, args } and resolves with the answer the
// main thread posts back ({ type: 'answer', callId, value }), or rejects with its error. receive()
// takes each answer message.
function createMainThreadCalls({ port }) {
  const pending = new Map();
  let nextId = 0;

  function call(method, args = {}) {
    nextId += 1;
    const callId = nextId;
    return new Promise((resolve, reject) => {
      pending.set(callId, { resolve, reject });
      port.postMessage({ type: 'call', callId, method, args });
    });
  }

  function receive({ callId, value, error }) {
    const waiting = pending.get(callId);
    if (waiting === undefined) return;
    pending.delete(callId);
    if (error !== undefined) {
      const failure = new Error(error.message);
      if (error.stack !== undefined) {
        failure.stack = error.stack;
      }
      waiting.reject(failure);
      return;
    }
    waiting.resolve(value);
  }

  return { call, receive };
}

export default createMainThreadCalls;
