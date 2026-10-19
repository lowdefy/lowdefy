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

import { get, type } from '@lowdefy/helpers';

import isRowEqual from './isRowEqual.js';

const EMPTY = [];

// `rowVersionField` is a dot path (`updated.timestamp`). A row without a version cannot be told
// apart by it, so it is compared field by field.
function isSameRow({ prior, row, rowVersionField }) {
  if (rowVersionField) {
    const priorVersion = get(prior, rowVersionField);
    const version = get(row, rowVersionField);
    if (!type.isNone(priorVersion) && !type.isNone(version))
      return isRowEqual(priorVersion, version);
  }
  return isRowEqual(prior, row);
}

// Diffs incoming rows against the previous render by row key, so unchanged rows keep their object
// identity (and their memoised row component) even though the engine delivers new copies. Rows
// that keep their position are matched positionally, without a key lookup; the key index is only
// rebuilt when rows move, arrive or leave. When nothing changed the previous array is returned,
// which keeps every TanStack row model memo warm.
function stabilizeData({ data, previous, getKey, rowVersionField }) {
  const source = data ?? EMPTY;
  if (previous && previous.source === source) return previous;
  const previousRows = previous?.rows ?? EMPTY;
  const rows = new Array(source.length);
  let changed = source.length !== previousRows.length;
  let moved = changed;
  const changedIndices = [];
  for (let i = 0; i < source.length; i++) {
    const row = source[i];
    const positional = previousRows[i];
    let next = row;
    if (positional === row) {
      rows[i] = row;
      continue;
    }
    const key = getKey(row);
    let prior;
    if (positional !== undefined && getKey(positional) === key) {
      prior = positional;
    } else {
      moved = true;
      prior = previous?.byKey.get(key);
    }
    if (prior !== undefined && isSameRow({ prior, row, rowVersionField })) next = prior;
    rows[i] = next;
    if (next !== positional) {
      changed = true;
      changedIndices.push(i);
    }
  }
  if (!changed && previous) return { source, rows: previousRows, byKey: previous.byKey };
  if (!moved && previous) {
    // Same keys in the same places: patch the index for the rows that changed.
    changedIndices.forEach((i) => previous.byKey.set(getKey(rows[i]), rows[i]));
    return { source, rows, byKey: previous.byKey };
  }
  const byKey = new Map();
  for (let i = 0; i < rows.length; i++) byKey.set(getKey(rows[i]), rows[i]);
  return { source, rows, byKey };
}

export default stabilizeData;
