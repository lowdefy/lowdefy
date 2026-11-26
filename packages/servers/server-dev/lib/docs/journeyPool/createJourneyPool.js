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
import { type } from '@lowdefy/helpers';

// A thread with no journey for this long stops: each holds the server and client engine, about
// 400 MB on a large production app, and a dev server runs all day. Five minutes covers an agent's
// edit-and-test cycle, so a loop of test runs keeps its threads.
const IDLE_MS = 5 * 60 * 1000;

function startWorker() {
  return new Worker(new URL('./journeyWorker.js', import.meta.url));
}

function toError({ message, stack }) {
  const error = new Error(message);
  if (stack !== undefined) {
    error.stack = stack;
  }
  return error;
}

// The dev server's journey pool: up to `size` worker threads (journeyWorker.js), each running one
// posted headless journey at a time. run({ params, mutant, host }) runs one on an idle thread and
// answers runHeadlessJob's { result, mutant }, or throws what the thread threw. `host` answers the
// thread's calls for that journey by method name (buildPage, pageJsEntries, dataStoreUri,
// dataStoreGone), each called with the call's args and { threadId }.
//
// - A thread starts when a journey finds every thread busy and fewer than `size` run, so a run of
//   a few journeys starts only as many as it keeps busy. A journey that finds `size` busy waits for
//   the first to be free, first come first served.
// - A thread loads the server code once. `readSignature()` reads what the code it loaded depends on
//   (the dev build's plugin files, readPluginSignature): a thread started on another signature is
//   stopped before it is given a journey, and a new one takes it, so a config build that changed a
//   plugin is seen by every journey that starts after it.
// - A thread with no journey for `idleMs` stops.
// - A thread that stops mid-journey (it crashed, or ran out of memory) fails that journey, and a
//   waiting journey starts a new one. A job that cannot be sent, or whose answer cannot be read,
//   fails and frees its thread.
// - `onThreadStopped({ threadId })` is called once a thread has stopped, however it stopped.
//
// close() stops every thread and fails the journeys still waiting. `started` counts the threads
// started so far, and `running` the threads running now.
function createJourneyPool({
  size,
  readSignature,
  onThreadStopped,
  idleMs = IDLE_MS,
  start = startWorker,
}) {
  const threads = new Set();
  const waiting = [];
  let nextId = 0;
  let started = 0;
  let closed = false;

  function retire(thread) {
    if (thread.retiring) return;
    thread.retiring = true;
    threads.delete(thread);
    clearTimeout(thread.idleTimer);
    thread.worker.terminate().catch(() => {});
  }

  function send(thread, job) {
    clearTimeout(thread.idleTimer);
    thread.job = job;
    try {
      thread.worker.postMessage({
        type: 'job',
        id: job.id,
        params: job.params,
        mutant: job.mutant,
      });
    } catch (error) {
      job.reject(error);
      free(thread);
    }
  }

  function dispatch(job) {
    const signature = readSignature();
    [...threads]
      .filter((thread) => thread.job === null && thread.signature !== signature)
      .forEach(retire);
    const idle = [...threads].find((thread) => thread.job === null);
    if (idle !== undefined) {
      send(idle, job);
    } else if (threads.size < size) {
      send(spawn(signature), job);
    } else {
      waiting.push(job);
    }
  }

  // A free thread takes the first waiting journey, or another idle thread takes it; one left idle
  // stops after idleMs.
  // A waiting journey that cannot be given a thread (a thread would not start) fails, rather than
  // throwing out of the thread event that freed the place.
  function dispatchWaiting() {
    const job = waiting.shift();
    try {
      dispatch(job);
    } catch (error) {
      job.reject(error);
    }
  }

  function free(thread) {
    thread.job = null;
    if (waiting.length > 0) {
      dispatchWaiting();
    }
    if (thread.job === null && !thread.retiring && !thread.stopped) {
      thread.idleTimer = setTimeout(() => retire(thread), idleMs);
      thread.idleTimer.unref?.();
    }
  }

  // An answer that cannot be cloned (DataCloneError) is answered with the error instead, so the
  // call fails rather than waiting forever. A thread that has stopped takes no answer.
  function post(thread, message) {
    try {
      thread.worker.postMessage(message);
    } catch (error) {
      try {
        thread.worker.postMessage({
          type: 'answer',
          callId: message.callId,
          error: {
            message: `The answer could not be sent to the journey thread: ${error.message}`,
          },
        });
      } catch {
        // The thread has stopped; its journey has already failed.
      }
    }
  }

  async function answerCall(thread, { callId, method, args }) {
    const handler = thread.job?.host?.[method];
    if (!type.isFunction(handler)) {
      post(thread, {
        type: 'answer',
        callId,
        error: {
          message: `The journey thread called "${method}", which its journey does not answer.`,
        },
      });
      return;
    }
    try {
      const value = await handler(args, { threadId: thread.threadId });
      post(thread, { type: 'answer', callId, value });
    } catch (error) {
      post(thread, {
        type: 'answer',
        callId,
        error: { message: error?.message ?? String(error), stack: error?.stack },
      });
    }
  }

  function spawn(signature) {
    const worker = start();
    const thread = {
      worker,
      threadId: worker.threadId,
      signature,
      job: null,
      idleTimer: null,
      retiring: false,
      stopped: false,
    };
    started += 1;
    threads.add(thread);
    worker.on('message', (message) => {
      if (message?.type === 'call') {
        answerCall(thread, message);
        return;
      }
      const job = thread.job;
      if (message?.type !== 'result' || job === null || message.id !== job.id) {
        return;
      }
      if (message.error !== undefined) {
        job.reject(toError(message.error));
      } else {
        job.resolve(message.value);
      }
      free(thread);
    });
    // A message that could not be read may have been the journey's answer or one of its calls,
    // which would then wait forever: the journey fails and the thread is stopped, so no journey of
    // its is left running beside the next.
    worker.on('messageerror', (error) => {
      const job = thread.job;
      if (job === null) return;
      thread.job = null;
      job.reject(
        new Error(`A message from the journey thread could not be read: ${error?.message}`)
      );
      retire(thread);
    });
    // `cause` is the thread's error, or its exit code.
    function stop(cause) {
      if (thread.stopped) return;
      thread.stopped = true;
      threads.delete(thread);
      clearTimeout(thread.idleTimer);
      const job = thread.job;
      thread.job = null;
      if (job !== null) {
        const reason = type.isNumber(cause)
          ? `it exited with code ${cause}`
          : (cause?.message ?? String(cause));
        const error = new Error(`The journey thread running this journey stopped: ${reason}`);
        if (type.isString(cause?.stack)) {
          error.stack = `${error.message}\n${cause.stack.split('\n').slice(1).join('\n')}`;
        }
        job.reject(error);
      }
      Promise.resolve(onThreadStopped?.({ threadId: thread.threadId })).catch(() => {});
      // A waiting journey takes the place this thread left.
      if (!closed && waiting.length > 0) {
        dispatchWaiting();
      }
    }
    worker.on('error', (error) => stop(error));
    worker.on('exit', (code) => stop(code));
    return thread;
  }

  function run({ params, mutant = null, host }) {
    if (closed) {
      return Promise.reject(new Error('The journey pool has closed.'));
    }
    return new Promise((resolve, reject) => {
      nextId += 1;
      dispatch({ id: nextId, params, mutant, host, resolve, reject });
    });
  }

  async function close() {
    closed = true;
    waiting.splice(0).forEach((job) => job.reject(new Error('The journey pool has closed.')));
    await Promise.all(
      [...threads].map(async (thread) => {
        thread.retiring = true;
        clearTimeout(thread.idleTimer);
        await thread.worker.terminate();
      })
    );
  }

  return {
    close,
    run,
    get started() {
      return started;
    },
    get running() {
      return threads.size;
    },
  };
}

export default createJourneyPool;
