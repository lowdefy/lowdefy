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
import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import resolveCellInputs from '../enrichment/resolveCellInputs.js';
import waitingParkMs from '../enrichment/waitingParkMs.js';

// What an enqueue does to one cell of a row it read:
//   missing: a required input has no value, so the cell is set to empty with
//            "Missing input: <column>" instead of queueing a call that can not run.
//   wait:    a required input column is queued or running, or queued by this same enqueue
//            (`pending`): queued with `waitingFor` and due only once those complete
//            (MongoDBEnrichmentComplete releases it), never "Missing input" for a column the
//            run is about to compute.
//   skip:    stale mode, and the cell's inputHash is the hash of the current inputs.
//   queue:   queued for this run. The previous value, raw and inputHash stay until a new
//            result lands, so the table keeps showing the old value while the cell re-runs.
// Each update's filter repeats the mode's condition (and, in stale mode, the inputHash read),
// so a cell that changed since it was read, or that a worker took, is left alone.
function planEnqueueCell({ doc, target, compiled, pending }) {
  const { filter, mode, now, runId } = compiled;
  const { columnKey, condition, inputHashPath, sources } = target;
  const { inputs, missing, waitingFor } = resolveCellInputs({ doc, sources, pending });
  const storedHash = get(doc, inputHashPath, { default: undefined });
  const match = andConditions([
    filter,
    { _id: doc._id },
    condition,
    mode === 'stale' ? { [inputHashPath]: storedHash } : null,
  ]);
  if (missing !== null) {
    return {
      kind: 'missing',
      operation: {
        updateOne: {
          filter: match,
          update: buildCellUpdate({
            columnKey,
            set: {
              status: 'empty',
              error: `Missing input: ${missing}`,
              runId,
              attempts: 0,
              finishedAt: now,
            },
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
        },
      },
    };
  }
  if (waitingFor.length > 0) {
    return {
      kind: 'wait',
      operation: {
        updateOne: {
          filter: match,
          update: buildCellUpdate({
            columnKey,
            set: {
              status: 'queued',
              runId,
              queuedAt: new Date(now.getTime() + waitingParkMs),
              attempts: 0,
              waitingFor,
            },
            unset: ['error', 'claimToken', 'leaseUntil', 'startedAt'],
          }),
        },
      },
    };
  }
  if (mode === 'stale' && hashEnrichmentInputs(inputs) === storedHash) {
    return { kind: 'skip' };
  }
  return {
    kind: 'queue',
    operation: {
      updateOne: {
        filter: match,
        update: buildCellUpdate({
          columnKey,
          set: { status: 'queued', runId, queuedAt: now, attempts: 0 },
          unset: ['error', 'claimToken', 'leaseUntil', 'startedAt', 'waitingFor'],
        }),
      },
    },
  };
}

export default planEnqueueCell;
