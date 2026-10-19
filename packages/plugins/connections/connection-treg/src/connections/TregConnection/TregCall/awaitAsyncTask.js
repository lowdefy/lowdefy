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

import { setTimeout as delay } from 'node:timers/promises';

import { ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import endpointIdPattern from '../endpointIdPattern.js';
import mapTregError from '../mapTregError.js';
import tregFetch from '../tregFetch.js';
import omitTreg from './omitTreg.js';
import readJsonPath from './readJsonPath.js';

const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_INTERVAL_MS = 2000;
// The descriptor's interval comes from treg (or a provider): an interval of 0 would poll in a
// tight loop, so it is never shorter than the shortest `await.intervalMs` the schema accepts.
const MIN_INTERVAL_MS = 100;
// Consecutive transient poll failures (network, 5xx, 429) before the wait gives up.
const MAX_POLL_FAILURES = 5;

const endpointIdRegex = new RegExp(endpointIdPattern);

function classifyStatus({ statusRule, document }) {
  const value = readJsonPath(document, statusRule?.path);
  if (type.isNone(value)) return { outcome: 'progress', status: null };
  const status = String(value);
  const has = (list) => (list ?? []).map(String).includes(status);
  if (has(statusRule.success)) return { outcome: 'success', status };
  if (has(statusRule.failure) || has(statusRule.billed_failure)) {
    return { outcome: 'failure', status };
  }
  return { outcome: 'progress', status };
}

// Polls an async task until its status is terminal or the await budget is spent.
//
// Polls go through /call/<poll endpoint>, like any catalog call, so treg injects the
// credential and checks the task belongs to this team. A descriptor that polls a dynamic
// URL is not followed: that would be the upstream-URL form TregCall never calls.
async function awaitAsyncTask({ connection, request, target, result, task, signal }) {
  const { descriptor } = task;
  if (!type.isString(task.pollEndpoint) || !endpointIdRegex.test(task.pollEndpoint)) {
    throw new Error(
      `treg's async task "${task.id}" for ${target} is polled at a URL, not a catalog endpoint, which TregCall does not follow.`
    );
  }
  const paramName = descriptor.poll?.param?.name ?? 'id';
  const timeoutMs = request.await.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const descriptorIntervalMs = Number.isFinite(descriptor.interval)
    ? descriptor.interval * 1000
    : DEFAULT_INTERVAL_MS;
  const intervalMs = Math.max(request.await.intervalMs ?? descriptorIntervalMs, MIN_INTERVAL_MS);
  const deadline = Date.now() + timeoutMs;
  const pollTarget = `the poll of async task "${task.id}" for ${target}`;
  let failures = 0;

  while (deadline - Date.now() > 0) {
    await delay(Math.min(intervalMs, deadline - Date.now()), undefined, { signal });
    let poll;
    try {
      poll = await tregFetch({
        connection,
        path: `/call/${task.pollEndpoint}`,
        query: { [paramName]: task.id },
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      failures += 1;
      if (failures >= MAX_POLL_FAILURES) throw error;
      continue;
    }
    if (poll.status < 200 || poll.status >= 300) {
      const error = mapTregError({ response: poll, target: pollTarget, connection });
      if (error.name !== 'ServiceError') throw error;
      failures += 1;
      if (failures >= MAX_POLL_FAILURES) throw error;
      continue;
    }
    failures = 0;
    const { outcome, status } = classifyStatus({
      statusRule: descriptor.status,
      document: poll.body,
    });
    if (outcome === 'failure') {
      const error = new Error(
        `treg async task "${task.id}" for ${target} ended with status "${status}".`
      );
      error.code = 'async_task_failed';
      throw error;
    }
    if (outcome === 'success') {
      const resultPath = descriptor.result?.path;
      return {
        ...result,
        output: type.isString(resultPath)
          ? readJsonPath(poll.body, resultPath) ?? null
          : omitTreg(poll.body),
        raw: poll.body,
        // The hold taken at submission, which treg settles when the task succeeds.
        cost: task.reserved,
        outcome: null,
        pending: false,
        task: { id: task.id, status, pollEndpoint: task.pollEndpoint, reserved: task.reserved },
        httpStatus: poll.status,
      };
    }
  }

  throw new ServiceError(
    `Async task "${task.id}" for ${target} did not finish within ${timeoutMs} ms (call id ${
      result.callId ?? 'unknown'
    }). It is still running and holds its reserve: retry with the same idempotencyKey to resume waiting for it without a new charge.`,
    {
      service: 'treg',
      code: 'async_timeout',
      retryAfter: Math.ceil(intervalMs / 1000),
    }
  );
}

export default awaitAsyncTask;
