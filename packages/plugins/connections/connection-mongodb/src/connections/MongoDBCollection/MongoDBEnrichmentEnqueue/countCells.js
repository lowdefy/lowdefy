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

// An enqueue's counts from each column's: queued (wait cells included) and missingInputs in
// all and by column, and skipped, the rest of the cells the selection holds.
function countCells({ cellCount, columns }) {
  const byColumn = {};
  let queued = 0;
  let missingInputs = 0;
  for (const column of columns) {
    byColumn[column.columnKey] = { queued: column.queued, missingInputs: column.missingInputs };
    queued += column.queued;
    missingInputs += column.missingInputs;
  }
  return {
    queued,
    skipped: Math.max(0, cellCount - queued - missingInputs),
    missingInputs,
    byColumn,
  };
}

export default countCells;
