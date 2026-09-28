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

import compareSortKeys from '@lowdefy/blocks-antd/table/compareSortKeys.js';

// Float64 sort keys from row keys and the distinct keys in ascending order (sorted with
// compareSortKeys). Keys the shared comparator calls equal (text that differs only in case or
// accents) share a rank; empty (null) keys are NaN.
function rankSortKeys({ rowKeys, ordered }) {
  const ranks = new Map();
  let rank = 0;
  for (let i = 0; i < ordered.length; i++) {
    if (i > 0 && compareSortKeys(ordered[i - 1], ordered[i]) !== 0) rank += 1;
    ranks.set(ordered[i], rank);
  }
  const keys = new Float64Array(rowKeys.length);
  for (let i = 0; i < rowKeys.length; i++) {
    const key = rowKeys[i];
    keys[i] = key === null ? NaN : ranks.get(key);
  }
  return keys;
}

export default rankSortKeys;
