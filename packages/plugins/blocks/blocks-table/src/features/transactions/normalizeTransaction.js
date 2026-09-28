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

// `{ add, update, remove, addIndex }`: rows to add, rows to merge into the row with the same key,
// and rows (or row keys) to remove.
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
  return {
    add: checkList({ list: transaction.add, name: 'add' }),
    update: checkList({ list: transaction.update, name: 'update' }),
    remove: checkList({ list: transaction.remove, name: 'remove' }),
    addIndex,
  };
}

export default normalizeTransaction;
