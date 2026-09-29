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
import getKeyMatch from './getKeyMatch.js';
import scopeFilter from './scopeFilter.js';

// Collection mode: every row is a document. One operation per row, all scoped by the base
// filter: deletes first (so a removed key can be added again), then one updateOne per changed
// row with its fields and its position merged into one $set, then the inserts, stamped with
// the filter's equalities (`scopeValues`, getChangeScope). `targets`
// names the operation of each existing row, so the save can report the rows that matched
// nothing (runChanges).
function compileCollectionChanges({
  changes,
  filter,
  generateId,
  insertDefaults,
  rowKeyField,
  rowKeyType,
  scopeValues,
}) {
  const operations = [];
  const insertedKeys = {};
  const targets = { removed: [], updated: [] };
  changes.removed.forEach((key) => {
    targets.removed.push({ index: operations.length, key });
    operations.push({
      deleteOne: {
        filter: scopeFilter({ filter, match: { [rowKeyField]: getKeyMatch({ key, rowKeyType }) } }),
      },
    });
  });
  changes.rows.forEach(({ key, patch }) => {
    targets.updated.push({ index: operations.length, key });
    operations.push({
      updateOne: {
        filter: scopeFilter({ filter, match: { [rowKeyField]: getKeyMatch({ key, rowKeyType }) } }),
        update: { $set: Object.fromEntries(patch) },
      },
    });
  });
  changes.added.forEach((entry) => {
    const { document, key } = buildNewRow({
      entry,
      insertDefaults,
      keyField: rowKeyField,
      generateId,
      scopeValues,
    });
    insertedKeys[String(entry.rowKey)] = key;
    operations.push({ insertOne: { document } });
  });
  return { operations, insertedKeys, targets };
}

export default compileCollectionChanges;
