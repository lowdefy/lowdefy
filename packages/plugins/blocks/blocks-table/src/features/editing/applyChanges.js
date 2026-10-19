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

import { get, serializer, set, type } from '@lowdefy/helpers';

import reorderByKeys from './reorderByKeys.js';
import sortByPosition from './sortByPosition.js';

function patchRow({ row, patch, position, positionField, cache }) {
  const cached = cache.get(row);
  if (cached && cached.patch === patch && cached.position === position) return cached.result;
  const result = serializer.copy(row);
  Object.entries(patch ?? {}).forEach(([field, value]) =>
    set(result, field, serializer.copy(value))
  );
  if (!type.isUndefined(position)) set(result, positionField, position);
  cache.set(row, { patch, position, result });
  return result;
}

function addedRow({ entry, keyField, cache }) {
  const cached = cache.get(entry);
  if (cached) return cached;
  const { rowKey, ...fields } = entry;
  const result = serializer.copy(fields);
  if (type.isNone(get(result, keyField))) set(result, keyField, rowKey);
  cache.set(entry, result);
  return result;
}

// The rows TableInput shows: `data` with its changeset applied. Removed rows leave, updated rows
// are copies with the changed fields set at their dot paths, added rows follow the data (with
// their key in the key field), and moves reorder (by `order`, or by the position field when
// positions changed). `data` is never written. Untouched rows keep their identity, and `cache`
// (a WeakMap owned by the table) keeps a touched row's copy while its patch object is the same,
// so an edit re-renders the rows it changed and no others.
function applyChanges({ rows, changes, getKey, keyField, positionField, cache }) {
  const { added, moved, order, removed, updated } = changes;
  const hasMoves = Boolean(moved) && Object.keys(moved).length > 0;
  if (
    Object.keys(updated).length === 0 &&
    removed.length === 0 &&
    added.length === 0 &&
    !hasMoves &&
    !order
  ) {
    return rows;
  }
  const removedKeys = new Set(removed.map(String));
  let result = [];
  rows.forEach((row) => {
    const key = String(getKey(row));
    if (removedKeys.has(key)) return;
    const patch = updated[key];
    const position = hasMoves && positionField ? moved[key] : undefined;
    if (!patch && type.isUndefined(position)) {
      result.push(row);
      return;
    }
    result.push(patchRow({ row, patch, position, positionField, cache }));
  });
  added.forEach((entry) => result.push(addedRow({ entry, keyField, cache })));
  if (order) {
    result = reorderByKeys({ rows: result, order, getKey });
  } else if (positionField && (hasMoves || added.length > 0)) {
    result = sortByPosition({ rows: result, positionField });
  }
  return result;
}

export default applyChanges;
