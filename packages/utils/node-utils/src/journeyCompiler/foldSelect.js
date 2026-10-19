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

import isSameBlock from './isSameBlock.js';

const INTERACTION_KINDS = ['pageview', 'click', 'change', 'key', 'back'];

function isOptionClick(record) {
  return record.kind === 'click' && record.target?.option === true;
}

// A pick from a dropdown popup is one `select`. The trigger click that opened
// it, and the typing into a searchable Selector or AutoComplete, are part of
// the pick: every Lowdefy dropdown renders its popup inside its own block, so
// the option click carries the block, and `option` tells it from a click on
// the trigger. Walking back from the option click, the non-option clicks and
// the changes on the same block since the previous interaction elsewhere are
// dropped; the option click stays and the step table compiles it to `select`.
function foldSelect({ records }) {
  const dropped = new Set();
  records.forEach((record, index) => {
    if (!isOptionClick(record)) return;
    for (let back = index - 1; back >= 0; back -= 1) {
      const candidate = records[back];
      if (!INTERACTION_KINDS.includes(candidate.kind)) continue;
      const opener =
        isSameBlock({ a: candidate, b: record }) &&
        (candidate.kind === 'change' || (candidate.kind === 'click' && !isOptionClick(candidate)));
      if (!opener) return;
      dropped.add(back);
    }
  });
  return records.filter((record, index) => !dropped.has(index));
}

export default foldSelect;
