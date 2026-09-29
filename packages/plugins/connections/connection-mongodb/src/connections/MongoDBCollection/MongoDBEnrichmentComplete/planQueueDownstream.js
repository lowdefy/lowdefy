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

import andConditions from '../enrichment/andConditions.js';
import buildCellUpdate from '../enrichment/buildCellUpdate.js';
import getLiveCondition from '../enrichment/getLiveCondition.js';

// The writes that queue the autoRun columns a cell that just completed ok feeds, in its row
// (the waterfall between columns): each such cell that is not live (queued, or running with a
// live lease) is queued now, as an enqueue in mode `all` would. Queued here, with the result,
// rather than by the worker afterwards, a crash between the two can not lose them, and a
// reader never sees the result without them. A claim then runs each, or finds an input missing.
function planQueueDownstream({ applied, compiled, now }) {
  const { downstreamByColumn, filter } = compiled;
  return applied
    .filter((cell) => cell.kind === 'ok')
    .flatMap(({ docId, result }) =>
      (downstreamByColumn.get(result.columnKey) ?? []).map((columnKey) => ({
        updateOne: {
          filter: andConditions([
            filter,
            { _id: docId },
            { $nor: [getLiveCondition({ columnKey, now })] },
          ]),
          update: buildCellUpdate({
            columnKey,
            set: { status: 'queued', queuedAt: now, attempts: 0 },
            unset: ['error', 'claimToken', 'leaseUntil', 'startedAt', 'waitingFor'],
          }),
        },
      }))
    );
}

export default planQueueDownstream;
