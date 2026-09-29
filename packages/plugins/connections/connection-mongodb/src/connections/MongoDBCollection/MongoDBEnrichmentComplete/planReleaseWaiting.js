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
import enrichPath from '../enrichment/enrichPath.js';

// The writes that release the row's cells waiting for a cell that just finished for good (ok,
// empty or a final error; not a retry): each dependent cell queued with this column in
// `waitingFor` is due at once. A claim then runs it, finds its input missing, or waits again
// for another input still running.
function planReleaseWaiting({ applied, compiled, now }) {
  const { dependentsByColumn, filter } = compiled;
  return applied
    .filter((cell) => cell.kind !== 'requeue')
    .flatMap(({ docId, result }) =>
      (dependentsByColumn.get(result.columnKey) ?? []).map((columnKey) => ({
        updateOne: {
          filter: andConditions([
            filter,
            { _id: docId },
            { [enrichPath({ columnKey, property: 'status' })]: 'queued' },
            { [enrichPath({ columnKey, property: 'waitingFor' })]: result.columnKey },
          ]),
          update: buildCellUpdate({ columnKey, set: { queuedAt: now }, unset: ['waitingFor'] }),
        },
      }))
    );
}

export default planReleaseWaiting;
