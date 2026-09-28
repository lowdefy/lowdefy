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

import isEmptySortValue from './isEmptySortValue.js';

// Turns the column values into Float64 ranks from their distinct values in sorted order (equal
// values share a rank; empty values are NaN).
function rankValues({ values, ordered, comparator }) {
  const ranks = new Map();
  let rank = 0;
  for (let i = 0; i < ordered.length; i++) {
    if (i > 0 && comparator(ordered[i - 1], ordered[i]) !== 0) rank += 1;
    ranks.set(ordered[i], rank);
  }
  const keys = new Float64Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    keys[i] = isEmptySortValue(value) ? NaN : ranks.get(value);
  }
  return keys;
}

export default rankValues;
