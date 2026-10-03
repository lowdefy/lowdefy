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

import recordTime from './recordTime.js';

const REPEAT_WINDOW_MS = 1000;
const TARGET_KEYS = ['block_id', 'row', 'column', 'text', 'nth', 'option'];

function sameTarget({ a, b }) {
  return a.page_id === b.page_id && TARGET_KEYS.every((key) => a.target?.[key] === b.target?.[key]);
}

// A double click or a rage burst is one step. Consecutive clicks on the same
// target within 1 s of the previous one collapse to the first, and a
// `frustration` any of them carried survives on it. Engine records between
// them do not separate them.
function collapseRepeatedClicks({ records }) {
  const kept = [];
  let lastClick;
  records.forEach((record) => {
    if (record.kind === 'engine') {
      kept.push(record);
      return;
    }
    const repeat =
      record.kind === 'click' &&
      !type.isUndefined(lastClick) &&
      sameTarget({ a: lastClick.record, b: record }) &&
      recordTime({ record }) - lastClick.time <= REPEAT_WINDOW_MS;
    if (repeat) {
      lastClick.time = recordTime({ record });
      if (type.isNone(kept[lastClick.position].frustration) && !type.isNone(record.frustration)) {
        kept[lastClick.position] = { ...kept[lastClick.position], frustration: record.frustration };
      }
      return;
    }
    lastClick =
      record.kind === 'click'
        ? { record, time: recordTime({ record }), position: kept.length }
        : undefined;
    kept.push(record);
  });
  return kept;
}

export { REPEAT_WINDOW_MS };

export default collapseRepeatedClicks;
