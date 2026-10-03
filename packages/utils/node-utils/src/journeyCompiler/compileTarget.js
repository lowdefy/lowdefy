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
  ['column', 'column'],
  ['text', 'text'],
  ['nth', 'nth'],
];

// A recorded target as the journey grammar writes it: the blockId string when
// the block is all there is, otherwise { blockId, row, column, text, nth } with
// the unknown parts left out. `containing` is for hand-written list picks and
// is never compiled.
function compileTarget({ target }) {
  const compiled = {};
  TARGET_FIELDS.forEach(([recordKey, stepKey]) => {
    if (!type.isNone(target[recordKey])) compiled[stepKey] = target[recordKey];
  });
  const keys = Object.keys(compiled);
  if (keys.length === 1 && keys[0] === 'blockId') return compiled.blockId;
  return compiled;
}

export default compileTarget;
