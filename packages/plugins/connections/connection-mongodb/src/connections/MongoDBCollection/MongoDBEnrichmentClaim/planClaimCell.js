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

import { get } from '@lowdefy/helpers';

import andConditions from '../enrichment/andConditions.js';
import buildCellUpdate from '../enrichment/buildCellUpdate.js';
import getClaimableCondition from '../enrichment/getClaimableCondition.js';
import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import pickRow from '../enrichment/pickRow.js';
import resolveCellInputs from '../enrichment/resolveCellInputs.js';
import waitingParkMs from '../enrichment/waitingParkMs.js';

function readCell({ doc, paths }) {
  return {
    attempts: get(doc, paths.attempts, { default: null }),
    claimToken: get(doc, paths.claimToken, { default: null }),
    runId: get(doc, paths.runId, { default: null }),
    status: get(doc, paths.status, { default: null }),
  };
}

function operation({ match, columnKey, set, unset }) {
  return { updateOne: { filter: match, update: buildCellUpdate({ columnKey, set, unset }) } };
}

// What a claim does to one candidate cell. Every update is a compare-and-set: its filter
// holds the cell's state as it was read (status, claimToken, attempts, runId) and that it is
// still claimable, so of two workers that read the same cell only the first write matches,
// and the second changes nothing. A claim carries the column config a worker needs (`kind`,
// `title`, `provider`, `prompt`, `output`), so the worker never rebuilds a map of the columns.
//   claim:   running, with a lease until `now + leaseMs`, attempts + 1 and a new claimToken.
//            The token is random, followed by the hash of the inputs the worker is given, which
//            MongoDBEnrichmentComplete stores as the result's inputHash.
//   expired: a lease that ran out on the last allowed attempt: the cell is an error.
//   missing: a required input has no value: empty, with the missing column named.
//            Both finish the cell for good, so runClaim releases the cells waiting for it.
//   wait:    an input column is still queued or running: queued again with `waitingFor`, and
//            released as soon as that input completes (MongoDBEnrichmentComplete).
function planClaimCell({ doc, target, compiled, now, generateToken }) {
  const { filter, fieldsByKey, leaseMs, maxAttempts, rowKeyField } = compiled;
  const { columnKey, kind, output, paths, prompt, provider, sources, title } = target;
  const read = readCell({ doc, paths });
  const match = andConditions([
    filter,
    { _id: doc._id },
    getClaimableCondition({ columnKey, now }),
    { [paths.status]: read.status },
    { [paths.claimToken]: read.claimToken },
    { [paths.attempts]: read.attempts },
    { [paths.runId]: read.runId },
  ]);
  const attempts = read.attempts ?? 0;
  if (read.status === 'running' && attempts >= maxAttempts) {
    return {
      kind: 'expired',
      docId: doc._id,
      columnKey,
      operation: operation({
        match,
        columnKey,
        set: {
          status: 'error',
          error: `The worker's lease ran out on attempt ${attempts} of ${maxAttempts}.`,
          finishedAt: now,
        },
        unset: ['claimToken', 'leaseUntil'],
      }),
    };
  }
  const { inputs, missing, waitingFor } = resolveCellInputs({ doc, sources });
  if (missing !== null) {
    return {
      kind: 'missing',
      docId: doc._id,
      columnKey,
      operation: operation({
        match,
        columnKey,
        set: { status: 'empty', error: `Missing input: ${missing}`, finishedAt: now },
        unset: [
          'value',
          'raw',
          'inputHash',
          'claimToken',
          'leaseUntil',
          'queuedAt',
          'startedAt',
          'waitingFor',
        ],
      }),
    };
  }
  if (waitingFor.length > 0) {
    return {
      kind: 'wait',
      operation: operation({
        match,
        columnKey,
        set: {
          status: 'queued',
          queuedAt: new Date(now.getTime() + waitingParkMs),
          waitingFor,
        },
        unset: ['claimToken', 'leaseUntil', 'startedAt'],
      }),
    };
  }
  const inputHash = hashEnrichmentInputs(inputs);
  const claimToken = `${generateToken()}:${inputHash}`;
  return {
    kind: 'claim',
    operation: operation({
      match,
      columnKey,
      set: {
        status: 'running',
        startedAt: now,
        leaseUntil: new Date(now.getTime() + leaseMs),
        attempts: attempts + 1,
        claimToken,
      },
      unset: ['waitingFor'],
    }),
    claim: {
      rowKey: get(doc, rowKeyField, { default: null }),
      columnKey,
      kind,
      ...(title === null ? {} : { title }),
      provider,
      ...(prompt === null ? {} : { prompt }),
      ...(output === null ? {} : { output }),
      runId: read.runId,
      claimToken,
      attempt: attempts + 1,
      inputHash,
      inputs,
      row: pickRow({ doc, fieldsByKey, rowKeyField }),
    },
    docId: doc._id,
    tokenPath: paths.claimToken,
  };
}

export default planClaimCell;
