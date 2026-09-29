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

function checkList({ list, name }) {
  if (type.isUndefined(list)) return [];
  if (!type.isArray(list)) {
    throw new Error(`applyTransaction "${name}" must be a list. Received ${JSON.stringify(list)}.`);
  }
  return list;
}

const MERGES = new Set(['shallow', 'deep']);

// `{ add, update, remove, addIndex, merge }`: rows to add, rows to merge into the row with the
// same key, and rows (or row keys) to remove. The default `shallow` replaces each top-level field
// an update has: for whole documents (a change stream's fullDocument), where a key the server
// removed must go from the row too. `merge: 'deep'` is for partial patches: nested objects of an
// update merge into the row's (a pushed `{ _id, _enrich: { email: {...} } }` keeps the row's
// other `_enrich` entries), and no key is ever removed.
function normalizeTransaction(transaction) {
  if (!type.isObject(transaction)) {
    throw new Error(
      `applyTransaction requires { add, update, remove }. Received ${JSON.stringify(transaction)}.`
    );
  }
  const { addIndex } = transaction;
  if (!type.isUndefined(addIndex) && !type.isInt(addIndex)) {
    throw new Error(
      `applyTransaction "addIndex" must be an integer. Received ${JSON.stringify(addIndex)}.`
    );
  }
  const merge = transaction.merge ?? 'shallow';
  if (!MERGES.has(merge)) {
    throw new Error(
      `applyTransaction "merge" must be "shallow" or "deep". Received ${JSON.stringify(
        transaction.merge
      )}.`
    );
  }
  return {
    merge,
    add: checkList({ list: transaction.add, name: 'add' }),
    update: checkList({ list: transaction.update, name: 'update' }),
    remove: checkList({ list: transaction.remove, name: 'remove' }),
    addIndex,
  };
}

export default normalizeTransaction;
