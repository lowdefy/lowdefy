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

function withoutKey(object, key) {
  if (!object || !Object.hasOwn(object, key)) return object;
  const next = { ...object };
  delete next[key];
  return next;
}

// A row deleted in TableInput. A row added in the table just leaves `added`; a data row joins
// `removed` (by its raw key) and its pending updates and move are dropped.
function removeChangeRow({ changes, rowKey }) {
  const key = String(rowKey);
  const next = { ...changes };
  if (changes.order) next.order = changes.order.filter((item) => String(item) !== key);
  if (changes.added.some((entry) => String(entry.rowKey) === key)) {
    next.added = changes.added.filter((entry) => String(entry.rowKey) !== key);
    return next;
  }
  if (!changes.removed.some((item) => String(item) === key)) {
    next.removed = [...changes.removed, rowKey];
  }
  next.updated = withoutKey(changes.updated, key);
  if (changes.moved) {
    next.moved = withoutKey(changes.moved, key);
    if (Object.keys(next.moved).length === 0) delete next.moved;
  }
  return next;
}

export default removeChangeRow;
