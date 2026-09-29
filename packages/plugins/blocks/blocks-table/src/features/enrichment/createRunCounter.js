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

const STATUSES = ['queued', 'running', 'ok', 'error', 'empty'];

function readPath({ row, parts }) {
  let current = row;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function emptyCounts() {
  return Object.fromEntries(STATUSES.map((status) => [status, 0]));
}

// The header chips' run state counts (`{ queued, running, ok, error, empty }` per run column,
// by column key), kept per table. Every websocket batch gives the table a new rows array, but
// applyTransaction keeps the identity of the rows it did not touch, so the statuses read from a
// row are remembered by row (a WeakMap) and only new or changed rows are read again; a change
// of the run columns reads every row again. Stale cells are not counted: that needs every row's
// inputs hashed.
function createRunCounter() {
  let signature = null;
  let statusesByRow = new WeakMap();
  return function countRuns({ rows, columns }) {
    const nextSignature = columns.map((column) => column.stateField).join('\n');
    if (nextSignature !== signature) {
      signature = nextSignature;
      statusesByRow = new WeakMap();
    }
    const paths = columns.map((column) => column.stateField.split('.'));
    const counts = columns.map(() => emptyCounts());
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let statuses = statusesByRow.get(row);
      if (statuses === undefined) {
        statuses = paths.map((parts) => readPath({ row, parts })?.status);
        statusesByRow.set(row, statuses);
      }
      for (let c = 0; c < statuses.length; c++) {
        if (Object.hasOwn(counts[c], statuses[c])) counts[c][statuses[c]] += 1;
      }
    }
    return new Map(columns.map((column, index) => [column.key, counts[index]]));
  };
}

export default createRunCounter;
