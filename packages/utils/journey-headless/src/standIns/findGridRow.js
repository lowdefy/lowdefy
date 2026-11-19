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

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';
import matchGridRows from './matchGridRows.js';

const LISTED_KEYS = 10;

function listKeys(rows) {
  const keys = rows.filter((entry) => entry.key !== null).map((entry) => String(entry.key));
  if (keys.length === 0) {
    return '';
  }
  const more = keys.length > LISTED_KEYS ? `, and ${keys.length - LISTED_KEYS} more` : '';
  return ` Its row keys: ${keys.slice(0, LISTED_KEYS).join(', ')}${more}.`;
}

// The one row of a grid (readGrid's model) keyed `rowKey`. A key no row has fails naming the keys
// the grid has, and the grid's fix when some rows have no key of their own; a key several rows
// share fails with the count, as the browser fails on several rows.
function findGridRow({ block, fix, grid, rowKey }) {
  const matches = matchGridRows({ rows: grid.rows, rowKey });
  if (matches.length === 1) {
    return matches[0];
  }
  const description = describeBlock(block);
  if (matches.length === 0) {
    const unkeyed = grid.rows.filter((entry) => entry.key === null).length;
    const unkeyedNote =
      unkeyed === 0 ? '' : ` ${unkeyed} of its rows have no key of their own: ${fix}.`;
    throw new HeadlessStepError(
      `${description} has no row with key "${rowKey}".${listKeys(grid.rows)}${unkeyedNote}`,
      { actual: `no row "${rowKey}"`, expected: `a row with key "${rowKey}" in ${description}` }
    );
  }
  throw new HeadlessStepError(
    `Matched ${matches.length} rows with key "${rowKey}" in ${description}; a row key names one row, so give each row its own key.`,
    { actual: `${matches.length} rows`, expected: `exactly one row with key "${rowKey}"` }
  );
}

export default findGridRow;
