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

import { journeyTargetSelectors } from '@lowdefy/helpers';

import HeadlessStepError from '../HeadlessStepError.js';

// A grid writes a generated key (`__row_<n>`) for a row whose data has none, and it changes
// between renders, so a step that names a row by one fails before it acts, with the grid's fix
// (readGrid's `fix`), in the browser runner's words.
function refuseGeneratedRowKey({ block, fix, rowKey }) {
  if (!journeyTargetSelectors.isGeneratedRowKey(rowKey)) {
    return;
  }
  const grid = `block "${block.blockId}" (${block.type})`;
  throw new HeadlessStepError(
    `Row key "${rowKey}" is a key ${grid} generated for a row with no key of its own, and it changes between renders: ${fix}, and name the row by that key.`,
    { actual: `the generated row key "${rowKey}"`, expected: `a row key the data of ${grid} holds` }
  );
}

export default refuseGeneratedRowKey;
