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

import { type } from '@lowdefy/helpers';

import createLazyMethodError from './createLazyMethodError.js';

// One FIFO per mounted lazy block. Calls made before the implementation has
// registered its methods wait here and run in call order whichever method they
// target, so a clear followed by a send can never run reversed. Every queued
// call settles: it runs on flush, or rejects on flush (never registered), load
// failure or unmount, so an awaiting event never hangs.
function createLazyMethodQueue() {
  const implementations = {};
  const calls = [];
  let status = 'loading';

  function register(method, implementation) {
    implementations[method] = implementation;
  }

  function call({ args, blockId, method }) {
    const implementation = implementations[method];
    // Once registered, and with nothing queued ahead, a call is synchronous
    // and returns the method's own result, exactly as for an eager block.
    if (calls.length === 0 && type.isFunction(implementation)) {
      return implementation(...args);
    }
    if (status !== 'loading') {
      throw createLazyMethodError({ blockId, method, reason: 'missing' });
    }
    return new Promise((resolve, reject) => {
      calls.push({ args, blockId, method, reject, resolve });
    });
  }

  // Runs after the implementation's effects, so every method it registers at
  // mount is recorded. A queued method can itself call another method; that
  // call joins the end of the queue and is still run by this loop.
  function flush() {
    while (calls.length > 0) {
      const { args, blockId, method, reject, resolve } = calls.shift();
      const implementation = implementations[method];
      if (type.isFunction(implementation)) {
        try {
          resolve(implementation(...args));
        } catch (error) {
          reject(error);
        }
      } else {
        reject(createLazyMethodError({ blockId, method, reason: 'missing' }));
      }
    }
    status = 'ready';
  }

  function close({ cause, reason }) {
    if (status === 'closed') {
      return;
    }
    status = 'closed';
    calls
      .splice(0)
      .forEach(({ blockId, method, reject }) =>
        reject(createLazyMethodError({ blockId, cause, method, reason }))
      );
  }

  return { call, close, flush, register };
}

export default createLazyMethodQueue;
