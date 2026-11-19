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

import { type } from '@lowdefy/helpers';

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';

// The shown column of a grid (readGrid's columns, in display order) a target's `column` names by
// its id, or with no `column` the first, which the browser clicks as the cell with
// aria-colindex 1.
function findGridColumn({ block, grid, column }) {
  const description = describeBlock(block);
  if (grid.columns.length === 0) {
    throw new HeadlessStepError(`${description} shows no columns.`, {
      actual: 'no columns',
      expected: `a shown column in ${description}`,
    });
  }
  if (type.isUndefined(column)) {
    return grid.columns[0];
  }
  const found = grid.columns.find((candidate) => candidate.id === String(column));
  if (type.isUndefined(found)) {
    throw new HeadlessStepError(
      `${description} shows no column "${column}". Its shown columns: ${grid.columns
        .map((candidate) => candidate.id)
        .join(', ')}.`,
      { actual: `no column "${column}"`, expected: `a shown column "${column}" in ${description}` }
    );
  }
  return found;
}

export default findGridColumn;
