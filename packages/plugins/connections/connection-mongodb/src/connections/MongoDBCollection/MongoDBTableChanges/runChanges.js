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

import findUnmatchedKeys from './findUnmatchedKeys.js';
import readItemKeyIds from './readItemKeyIds.js';
import readKeyIds from './readKeyIds.js';

// A bulkWrite reports matched and deleted counts for all its operations together, so the
// rows that matched nothing are found with a read of their keys, scoped by the operations'
// own filters (base filter and tenant included):
// - removed rows before the write, since afterwards every removed row is gone, matched or
//   not. A row someone else deleted between the read and the write counts as matched: it is
//   gone, as the save asked.
// - updated rows after the write, and only when fewer matched than were updated, so a save
//   whose every row matched costs the write alone.
// - array mode: the document's item keys before the write, when the changes name existing
//   items.
async function runCollectionChanges({ collection, compiled, operations }) {
  const { keyField, rowKeyType, targets } = compiled;
  let unmatchedRemoved = [];
  if (targets.removed.length > 0) {
    const keyIds = await readKeyIds({
      collection,
      filter: { $or: targets.removed.map(({ index }) => operations[index].deleteOne.filter) },
      keyField,
    });
    unmatchedRemoved = findUnmatchedKeys({
      keys: targets.removed.map(({ key }) => key),
      keyIds,
      rowKeyType,
    });
  }
  const result = await collection.bulkWrite(operations, compiled.options);
  let unmatchedUpdated = [];
  if (result.matchedCount < targets.updated.length) {
    const keyIds = await readKeyIds({
      collection,
      filter: { $or: targets.updated.map(({ index }) => operations[index].updateOne.filter) },
      keyField,
    });
    unmatchedUpdated = findUnmatchedKeys({
      keys: targets.updated.map(({ key }) => key),
      keyIds,
      rowKeyType,
    });
  }
  return { result, unmatchedRemoved, unmatchedUpdated };
}

async function runArrayChanges({ collection, compiled, operations }) {
  const { array, rowKeyType, targets } = compiled;
  let unmatchedRemoved = [];
  let unmatchedUpdated = [];
  if (targets.removed.length + targets.updated.length > 0) {
    const keyIds = await readItemKeyIds({
      collection,
      filter: operations[0].updateOne.filter,
      path: array.path,
      itemKeyField: array.itemKeyField,
    });
    unmatchedRemoved = findUnmatchedKeys({ keys: targets.removed, keyIds, rowKeyType });
    unmatchedUpdated = findUnmatchedKeys({ keys: targets.updated, keyIds, rowKeyType });
  }
  const result = await collection.bulkWrite(operations, compiled.options);
  return { result, unmatchedRemoved, unmatchedUpdated };
}

// Runs the compiled operations (already tenant scoped) and finds the rows that matched
// nothing: outside the filter, deleted, or never there.
async function runBulkChanges({ collection, compiled, operations }) {
  const result = await collection.bulkWrite(operations, compiled.options);
  return { result };
}

function runChanges({ collection, compiled, operations }) {
  if (compiled.mode === 'bulk') return runBulkChanges({ collection, compiled, operations });
  if (compiled.mode === 'array') return runArrayChanges({ collection, compiled, operations });
  return runCollectionChanges({ collection, compiled, operations });
}

export default runChanges;
