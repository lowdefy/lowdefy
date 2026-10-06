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

import hasClickedText from './hasClickedText.js';
import isSameBlock from './isSameBlock.js';
import recordTime from './recordTime.js';

const TOGGLE_WINDOW_MS = 1000;

function isLabelledClick(record) {
  return record.kind === 'click' && hasClickedText({ target: record.target });
}

function isUnlabelledClick(record) {
  return record.kind === 'click' && !isLabelledClick(record);
}

// Picking a radio, checkbox or segmented option is one labelled click. The
// browser also reports a click on the hidden input and a change on it
// (autocapture sends label click, input click, input change; the recorder sees
// a click and an input event). A change that comes within 1 s after a labelled
// click on the same block is dropped, together with the unlabelled clicks on
// that block between them, so `click: { blockId, text }` is the one step.
function foldOptionToggle({ records }) {
  const dropped = new Set();
  records.forEach((record, index) => {
    if (record.kind !== 'change') return;
    const between = [];
    for (let back = index - 1; back >= 0; back -= 1) {
      const candidate = records[back];
      if (recordTime({ record }) - recordTime({ record: candidate }) > TOGGLE_WINDOW_MS) return;
      if (!isSameBlock({ a: candidate, b: record })) continue;
      if (isLabelledClick(candidate)) {
        dropped.add(index);
        between.forEach((position) => dropped.add(position));
        return;
      }
      if (!isUnlabelledClick(candidate)) return;
      between.push(back);
    }
  });
  return records.filter((record, index) => !dropped.has(index));
}

export default foldOptionToggle;
