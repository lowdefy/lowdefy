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

import mergeRowPatch from './mergeRowPatch.js';

// Applies a normalised transaction to a rows array without mutating it. Updated rows are new
// objects (merged into the row with the same key: shallow, or deep with `merge: 'deep'`); every
// other row keeps its identity, so only touched rows re-render. Keys to remove may be given as rows or as key values.
function applyTransactionToRows({ rows, transaction, getKey }) {
  const { add, update, remove, addIndex, merge } = transaction;
  const updates = new Map();
  update.forEach((row) => updates.set(String(getKey(row)), row));
  const removals = new Set(
    remove.map((entry) => String(type.isObject(entry) ? getKey(entry) : entry))
  );
  const changed = { added: add.length, updated: 0, removed: 0 };
  const next = [];
  rows.forEach((row) => {
    const id = String(getKey(row));
    if (removals.has(id)) {
      changed.removed += 1;
      return;
    }
    const patch = updates.get(id);
    if (patch === undefined) {
      next.push(row);
      return;
    }
    changed.updated += 1;
    next.push(merge === 'deep' ? mergeRowPatch({ row, patch }) : { ...row, ...patch });
  });
  if (add.length > 0) {
    const index = type.isUndefined(addIndex)
      ? next.length
      : Math.min(Math.max(addIndex, 0), next.length);
    next.splice(index, 0, ...add);
  }
  return { rows: next, changed };
}

export default applyTransactionToRows;
