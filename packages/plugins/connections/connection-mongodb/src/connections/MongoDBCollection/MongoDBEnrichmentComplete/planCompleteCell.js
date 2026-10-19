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

import { BSON } from 'mongodb';
import { get } from '@lowdefy/helpers';

import andConditions from '../enrichment/andConditions.js';
import buildCellUpdate from '../enrichment/buildCellUpdate.js';
import enrichPath from '../enrichment/enrichPath.js';
import limitRaw from './limitRaw.js';

const maxBackoffMs = 86400000;

function operation({ match, columnKey, set, unset }) {
  return { updateOne: { filter: match, update: buildCellUpdate({ columnKey, set, unset }) } };
}

// The wait before a failed cell is claimed again: the result's retryAfterMs when the provider
// said how long to wait (a rate limit's Retry-After), else backoffMs doubled per attempt made.
// Either is at most a day.
function getBackoff({ backoffMs, attempts, retryAfterMs }) {
  if (retryAfterMs !== null) return Math.min(retryAfterMs, maxBackoffMs);
  return Math.min(backoffMs * 2 ** Math.max(attempts - 1, 0), maxBackoffMs);
}

// The micro-USD the provider call behind this result cost, when the result reports it (a
// treg-backed provider reads it from X-Treg-Cost-Micro). A result without a cost leaves the
// cell's cost as it was.
function getCost(result) {
  return result.cost === undefined ? {} : { cost: result.cost };
}

function planError({ result, match, attempts, compiled, now }) {
  const { backoffMs, maxAttempts } = compiled;
  if (result.retry && attempts < maxAttempts) {
    return {
      kind: 'requeue',
      operation: operation({
        match,
        columnKey: result.columnKey,
        set: {
          status: 'queued',
          queuedAt: new Date(
            now.getTime() + getBackoff({ backoffMs, attempts, retryAfterMs: result.retryAfterMs })
          ),
          error: result.error,
          ...getCost(result),
        },
        unset: ['leaseUntil', 'startedAt'],
      }),
    };
  }
  return {
    kind: 'error',
    operation: operation({
      match,
      columnKey: result.columnKey,
      set: { status: 'error', error: result.error, finishedAt: now, ...getCost(result) },
      unset: ['leaseUntil'],
    }),
  };
}

// What a result writes to its cell. The filter holds the claim: the cell's claimToken and
// status running, so a worker whose lease ran out (and whose cell was claimed again, or
// re-queued) changes nothing.
//   ok / empty: the value and raw of this result replace the previous ones (an empty result
//               has no value), with the inputHash of the inputs the claim was given.
//   requeue:    an error below maxAttempts: queued again after the result's retryAfterMs, or
//               else backoffMs doubled per attempt made, keeping the error message and the
//               previous result.
//   error:      an error on the last attempt, or with retry: false. The previous value stays.
// Any result with a cost stores it as the cell's cost.
// A value larger than rawMaxBytes is a final error; a raw larger than it is stored as a
// truncation marker.
function planCompleteCell({ result, doc, compiled, now }) {
  const { columnKey, claimToken } = result;
  const match = andConditions([
    compiled.filter,
    { _id: doc._id },
    { [enrichPath({ columnKey, property: 'claimToken' })]: claimToken },
    { [enrichPath({ columnKey, property: 'status' })]: 'running' },
  ]);
  const attempts = get(doc, enrichPath({ columnKey, property: 'attempts' }), { default: 1 });
  if (result.status === 'error') {
    return planError({ result, match, attempts, compiled, now });
  }
  if (result.value !== undefined) {
    const valueBytes = BSON.calculateObjectSize({ value: result.value });
    if (valueBytes > compiled.rawMaxBytes) {
      return planError({
        result: {
          ...result,
          retry: false,
          error: `The result value is ${valueBytes} bytes, more than rawMaxBytes (${compiled.rawMaxBytes}).`,
        },
        match,
        attempts,
        compiled,
        now,
      });
    }
  }
  const set = {
    status: result.status,
    inputHash: result.inputHash,
    finishedAt: now,
    ...getCost(result),
  };
  const unset = ['error', 'leaseUntil'];
  if (result.status === 'ok' && result.value !== undefined) {
    set.value = result.value;
  } else {
    unset.push('value');
  }
  if (result.raw === undefined) {
    unset.push('raw');
  } else {
    set.raw = limitRaw({ raw: result.raw, rawMaxBytes: compiled.rawMaxBytes });
  }
  return { kind: result.status, operation: operation({ match, columnKey, set, unset }) };
}

export default planCompleteCell;
