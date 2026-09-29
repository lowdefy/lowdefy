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
import buildNewRow from './buildNewRow.js';
import compileArrayOrder from './compileArrayOrder.js';
import getKeyForms from './getKeyForms.js';
import getKeyMatch from './getKeyMatch.js';
import scopeFilter from './scopeFilter.js';

function compileItemUpdates({ rows, path, itemKeyField, rowKeyType }) {
  const $set = {};
  const arrayFilters = [];
  rows.forEach(({ key, patch }, index) => {
    const identifier = `r${index}`;
    patch.forEach((value, fieldPath) => {
      $set[`${path}.$[${identifier}].${fieldPath}`] = value;
    });
    arrayFilters.push({ [`${identifier}.${itemKeyField}`]: getKeyMatch({ key, rowKeyType }) });
  });
  return { update: { $set }, arrayFilters };
}

// Array mode: every row is an item of the array at `path` in one document, and every
// operation matches that document inside the base filter. MongoDB can not $set into, $pull
// from and $push to the same array in one update, so each is its own operation, in order:
//   1. one $set of every changed item field and position, an array filter per item;
//   2. one $pull of the removed items by key;
//   3. one $push of the added items;
//   4. without a positionField, a pipeline update that applies `order`.
// `targets` are the existing items the changes name, so the save can report the ones that
// are not in the array (runChanges).
function compileArrayChanges({ array, changes, filter, generateId, insertDefaults, rowKeyType }) {
  const { documentId, itemKeyField, path } = array;
  const documentFilter = scopeFilter({ filter, match: { _id: documentId } });
  const operations = [];
  const insertedKeys = {};
  if (changes.rows.length > 0) {
    operations.push({
      updateOne: {
        filter: documentFilter,
        ...compileItemUpdates({ rows: changes.rows, path, itemKeyField, rowKeyType }),
      },
    });
  }
  if (changes.removed.length > 0) {
    operations.push({
      updateOne: {
        filter: documentFilter,
        update: {
          $pull: {
            [path]: {
              [itemKeyField]: {
                $in: changes.removed.flatMap((key) => getKeyForms({ key, rowKeyType })),
              },
            },
          },
        },
      },
    });
  }
  const addedKeys = changes.added.map((entry) => {
    const { document, key } = buildNewRow({
      entry,
      insertDefaults,
      keyField: itemKeyField,
      generateId,
    });
    insertedKeys[String(entry.rowKey)] = key;
    return { document, key };
  });
  if (addedKeys.length > 0) {
    operations.push({
      updateOne: {
        filter: documentFilter,
        update: { $push: { [path]: { $each: addedKeys.map((item) => item.document) } } },
      },
    });
  }
  if (changes.order !== undefined) {
    const keys = changes.order.map((item) =>
      item.addedIndex === undefined ? item.key : addedKeys[item.addedIndex].key
    );
    operations.push({
      updateOne: {
        filter: documentFilter,
        update: compileArrayOrder({
          path,
          itemKeyField,
          keyForms: keys.map((key) => getKeyForms({ key, rowKeyType })),
        }),
      },
    });
  }
  const targets = { removed: changes.removed, updated: changes.rows.map((row) => row.key) };
  return { operations, insertedKeys, targets };
}

export default compileArrayChanges;
