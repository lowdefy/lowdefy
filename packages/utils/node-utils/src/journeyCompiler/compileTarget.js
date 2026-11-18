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

const TARGET_FIELDS = [
  ['block_id', 'blockId'],
  ['row', 'row'],
  ['row_key', 'rowKey'],
  ['column', 'column'],
  ['control', 'control'],
  ['text', 'text'],
  ['nth', 'nth'],
];

// A recorded click target as the journey grammar writes it: the blockId
// string when the block is all there is, otherwise { blockId, row, rowKey,
// column, control, text, nth } with the unknown parts left out. A row with its
// own key is named by the key, not its displayed index, so the step runs
// headless and stays put when the grid sorts; a control has no text or nth.
// `containing` is for hand-written list picks and is never compiled.
function compileTarget({ target }) {
  const compiled = {};
  TARGET_FIELDS.forEach(([recordKey, stepKey]) => {
    if (!type.isNone(target[recordKey])) compiled[stepKey] = target[recordKey];
  });
  if (!type.isUndefined(compiled.rowKey)) delete compiled.row;
  if (!type.isUndefined(compiled.control)) {
    delete compiled.text;
    delete compiled.nth;
  }
  const keys = Object.keys(compiled);
  if (keys.length === 1 && keys[0] === 'blockId') return compiled.blockId;
  return compiled;
}

export default compileTarget;
