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

import assertPatchPaths from './assertPatchPaths.js';
import getKeyId from './getKeyId.js';
import getRowPatch from './getRowPatch.js';
import parseAddedRows from './parseAddedRows.js';
import parseMovedRows from './parseMovedRows.js';
import parseOrder from './parseOrder.js';
import parseRemovedRows from './parseRemovedRows.js';
import parseUpdatedRows from './parseUpdatedRows.js';

// The same step TableInput renumbers positions in.
const POSITION_STEP = 1024;

const parts = {
  updated: { isType: type.isObject, expected: 'an object', size: (value) => Object.keys(value) },
  added: { isType: type.isArray, expected: 'an array', size: (value) => value },
  removed: { isType: type.isArray, expected: 'an array', size: (value) => value },
  moved: { isType: type.isObject, expected: 'an object', size: (value) => Object.keys(value) },
  order: { isType: type.isArray, expected: 'an array', size: (value) => value },
};

function countChanges(changes) {
  let count = 0;
  Object.entries(parts).forEach(([part, { isType, expected, size }]) => {
    const value = changes[part];
    if (type.isNone(value)) return;
    if (!isType(value)) {
      throw new Error(
        `MongoDBTableChanges changes "${part}" should be ${expected}. Received ${JSON.stringify(
          value
        )}.`
      );
    }
    count += size(value).length;
  });
  return count;
}

function assertChangesShape({ changes, maxChanges }) {
  if (!type.isObject(changes)) {
    throw new Error(
      `MongoDBTableChanges requires "changes", the TableInput value { updated, added, removed, moved, order }. Received ${JSON.stringify(
        changes
      )}.`
    );
  }
  const unknown = Object.keys(changes).filter((part) => !Object.hasOwn(parts, part));
  if (unknown.length > 0) {
    throw new Error(
      `MongoDBTableChanges changes can only have "updated", "added", "removed", "moved" and "order". Received ${JSON.stringify(
        unknown
      )}.`
    );
  }
  // Counted before anything is parsed, so an oversized changeset costs nothing.
  const count = countChanges(changes);
  if (count === 0) {
    throw new Error('MongoDBTableChanges changes are empty: there is nothing to write.');
  }
  if (count > maxChanges) {
    throw new Error(
      `MongoDBTableChanges changes have ${count} row changes, more than "maxChanges" (${maxChanges}).`
    );
  }
  if (Object.keys(changes.moved ?? {}).length > 0 && (changes.order ?? []).length > 0) {
    throw new Error(
      'MongoDBTableChanges changes can have "moved" positions or an "order", not both.'
    );
  }
}

function assertRemovedNotChanged({ removed, rows, order }) {
  const orderIds = new Set(
    (order ?? []).filter((item) => item.key !== undefined).map((item) => getKeyId(item.key))
  );
  removed.forEach((key) => {
    const keyId = getKeyId(key);
    if (rows.has(keyId) || orderIds.has(keyId)) {
      throw new Error(
        `MongoDBTableChanges row ${JSON.stringify(
          key
        )} is removed, so it can not also be updated, moved or ordered.`
      );
    }
  });
}

// With a positionField, an order becomes a position per row (1024, 2048, ...), so the save
// writes positions like a TableInput with rowDrag.positionField would.
function applyOrderPositions({ order, rows, added, positionField }) {
  order.forEach((item, index) => {
    const position = (index + 1) * POSITION_STEP;
    if (item.addedIndex === undefined) {
      getRowPatch({ rows, key: item.key }).set(positionField, position);
    } else {
      added[item.addedIndex].patch.set(positionField, position);
    }
  });
}

// The TableInput changeset, validated against the allowlist and coerced to the field types:
//   rows:    [{ key, patch }]       existing rows to update ("updated" and "moved" merged)
//   added:   [{ rowKey, patch }]    new rows, by their browser key
//   removed: [key]                  existing rows to delete
//   order:   [{ key } | { addedIndex }] | undefined, a key order to apply without positions
// A patch is a Map of document path to value.
function parseChanges({ changes, fieldsByKey, keyField, maxChanges, positionField, rowKeyType }) {
  assertChangesShape({ changes, maxChanges });
  const rows = new Map();
  parseUpdatedRows({ updated: changes.updated ?? {}, fieldsByKey, rowKeyType, rows });
  parseMovedRows({ moved: changes.moved ?? {}, positionField, rowKeyType, rows });
  const added = parseAddedRows({ added: changes.added ?? [], fieldsByKey, positionField });
  const removed = parseRemovedRows({ removed: changes.removed ?? [], rowKeyType });
  let order;
  if ((changes.order ?? []).length > 0) {
    order = parseOrder({ order: changes.order, added, rowKeyType });
  }
  assertRemovedNotChanged({ removed, rows, order });
  if (order !== undefined && !type.isNone(positionField)) {
    applyOrderPositions({ order, rows, added, positionField });
    order = undefined;
  }
  rows.forEach(({ key, patch }) => {
    assertPatchPaths({ patch, keyField, location: `row ${JSON.stringify(key)}` });
  });
  added.forEach(({ rowKey, patch }) => {
    assertPatchPaths({ patch, location: `added row ${JSON.stringify(rowKey)}` });
  });
  return { rows: [...rows.values()], added, removed, order };
}

export default parseChanges;
