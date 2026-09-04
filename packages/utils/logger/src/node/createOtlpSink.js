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

import toOtlpAnyValue from './toOtlpAnyValue.js';
import toOtlpLogRecord from './toOtlpLogRecord.js';

const defaultBatchSize = 50;
const defaultFlushMs = 2000;
const warnIntervalMs = 60000;

// A pino stream leg that buffers log lines and POSTs them as OTLP/HTTP JSON.
//
// Not a pino `transport`: a transport is a worker thread, and on serverless the
// invocation can be frozen between the log call and the worker's flush, which
// drops lines silently. This sink lives on the request thread and is flushed
// explicitly - through the platform's waitUntil after the response, on a timer,
// and on process exit - so the flush is something the host can wait for.
//
// It is a sink: it never throws into the app. A failed export retries once and
// is then dropped, with at most one console warning a minute.
function createOtlpSink({ endpoint, headers = {}, resource = {}, batch = {} } = {}) {
  const size = batch.size ?? defaultBatchSize;
  const flushMs = batch.flush_ms ?? defaultFlushMs;
  const resourceKeys = Object.keys(resource);
  const resourceAttributes = resourceKeys.map((key) => ({
    key,
    value: toOtlpAnyValue(resource[key]),
  }));
  const scope = { name: '@lowdefy/logger' };

  let records = [];
  let timer = null;
  const inFlight = new Set();
  let lastWarnAt = 0;

  function warn(error) {
    const now = Date.now();
    if (now - lastWarnAt < warnIntervalMs) return;
    lastWarnAt = now;
    // eslint-disable-next-line no-console
    console.warn(`Lowdefy OTLP log export failed, dropping logs: ${error.message}`);
  }

  async function post(body) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body,
    });
    if (!response.ok) {
      throw new Error(`${endpoint} responded ${response.status}.`);
    }
  }

  async function send(logRecords) {
    const body = JSON.stringify({
      resourceLogs: [
        {
          resource: { attributes: resourceAttributes },
          scopeLogs: [{ scope, logRecords }],
        },
      ],
    });
    try {
      await post(body);
    } catch {
      try {
        await post(body);
      } catch (retryError) {
        warn(retryError);
      }
    }
  }

  function drain() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (records.length === 0) return;
    const batchRecords = records;
    records = [];
    const promise = send(batchRecords).finally(() => inFlight.delete(promise));
    inFlight.add(promise);
  }

  function write(chunk) {
    records.push(toOtlpLogRecord({ line: JSON.parse(chunk), resourceKeys }));
    if (records.length >= size) {
      drain();
      return;
    }
    if (timer === null) {
      timer = setTimeout(drain, flushMs);
      // The export timer must never be what keeps a process alive.
      timer.unref?.();
    }
  }

  // Resolves once everything buffered at call time has been exported (or
  // dropped), which is what the platform's waitUntil is given to await.
  function flush() {
    drain();
    return Promise.all([...inFlight]);
  }

  return { write, flush };
}

export default createOtlpSink;
