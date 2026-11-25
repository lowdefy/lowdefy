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

const CLOSE_TIMEOUT_MS = 10000;

function startWorker(workerData) {
  return new Worker(new URL('./headlessWorker.js', import.meta.url), { workerData });
}

function toError({ message, stack, refused }) {
  const error = new Error(message);
  if (stack !== undefined) {
    error.stack = stack;
  }
  if (refused === true) {
    error.refused = true;
  }
  return error;
}

// The worker threads of a --build run, up to `size` of them, each running one journey at a time
// on a production build it opened itself (headlessWorker, given `workerData`: the run's
// { directories, secrets }). A thread is started when a journey finds every thread busy and fewer
// than `size` are running, so a run of a few journeys starts only as many as it keeps busy; once
// started, it serves the rest of the run. run({ item, repeat }) runs one item on an idle thread
// and answers its result, or throws what the run threw there: with `refused: true` when the thread
// could not open the build (openBuildApp refused it, as a build rewritten since the run opened it
// is). A job that cannot be sent to its thread, or whose answer cannot be read, fails that job and
// frees the thread. A thread that stops (it crashed, or
// ran out of memory) fails the journey it was running, and the next journey starts a new one. A
// journey that finds `size` threads busy waits for the first to be free; the caller's pool keeps
// no more in flight than that. close() asks each thread to close its app and stops it, after
// CLOSE_TIMEOUT_MS at most. `started` counts the threads started so far.
function createHeadlessWorkers({ size, workerData, start = startWorker }) {
  const threads = new Set();
  // Jobs waiting for a thread, first come first served.
  const waiting = [];
  let nextId = 0;
  let started = 0;
  let closed = false;

  function send(thread, job) {
    thread.job = job;
    try {
      thread.worker.postMessage({ id: job.id, item: job.item, repeat: job.repeat });
    } catch (error) {
      job.reject(error);
      free(thread);
    }
  }

  // A thread that is free takes the first waiting job, if any.
  function free(thread) {
    thread.job = null;
    if (waiting.length > 0) {
      send(thread, waiting.shift());
    }
  }

  function spawn() {
    const thread = { worker: start(workerData), job: null, stopped: false, onClosed: null };
    started += 1;
    threads.add(thread);
    thread.worker.on('message', (message) => {
      if (message?.type === 'closed') {
        thread.onClosed?.();
        return;
      }
      const job = thread.job;
      if (job === null || message?.id !== job.id) {
        return;
      }
      if (message.error !== undefined) {
        job.reject(toError(message.error));
      } else {
        job.resolve(message.result);
      }
      free(thread);
    });
    // `cause` is the thread's error, or its exit code.
    function stop(cause) {
      if (thread.stopped) return;
      thread.stopped = true;
      threads.delete(thread);
      thread.onClosed?.();
      const job = thread.job;
      thread.job = null;
      if (job !== null) {
        const reason = type.isNumber(cause)
          ? `it exited with code ${cause}`
          : (cause?.message ?? String(cause));
        const error = new Error(`The worker thread running this journey stopped: ${reason}`);
        if (type.isString(cause?.stack)) {
          error.stack = `${error.message}\n${cause.stack.split('\n').slice(1).join('\n')}`;
        }
        job.reject(error);
      }
      // A waiting job takes the place this thread left.
      if (!closed && waiting.length > 0) {
        send(spawn(), waiting.shift());
      }
    }
    // An answer that could not be read leaves its job unanswered: it fails, and the thread is free.
    thread.worker.on('messageerror', (error) => {
      const job = thread.job;
      if (job === null) return;
      job.reject(
        new Error(`The answer from the worker thread could not be read: ${error?.message}`)
      );
      free(thread);
    });
    thread.worker.on('error', (error) => stop(error));
    thread.worker.on('exit', (code) => stop(code));
    return thread;
  }

  function run({ item, repeat }) {
    if (closed) {
      return Promise.reject(new Error('The run has closed its worker threads.'));
    }
    return new Promise((resolve, reject) => {
      nextId += 1;
      const job = { id: nextId, item, repeat, resolve, reject };
      const idle = [...threads].find((thread) => thread.job === null);
      if (idle !== undefined) {
        send(idle, job);
      } else if (threads.size < size) {
        send(spawn(), job);
      } else {
        waiting.push(job);
      }
    });
  }

  async function closeThread(thread) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, CLOSE_TIMEOUT_MS);
      thread.onClosed = () => {
        clearTimeout(timer);
        resolve();
      };
      try {
        thread.worker.postMessage({ type: 'close' });
      } catch {
        thread.onClosed();
      }
    });
    await thread.worker.terminate();
  }

  async function close() {
    closed = true;
    waiting
      .splice(0)
      .forEach((job) => job.reject(new Error('The run has closed its worker threads.')));
    await Promise.all([...threads].map(closeThread));
  }

  return {
    close,
    run,
    get started() {
      return started;
    },
  };
}

export default createHeadlessWorkers;
