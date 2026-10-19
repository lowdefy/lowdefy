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

// A function giving each row its key: the `rowKey` field when set, otherwise
// `_id`, then `id`. A row with none of them gets a key tied to the row object
// (a WeakMap), which is stable while the same object is shown but not across a
// refetch that returns new objects; give rows an id to keep selection and
// expansion across refetches.
function createRowKeyGetter({ rowKey } = {}) {
  const generated = new WeakMap();
  let counter = 0;
  return function getRowKey(row) {
    const key = type.isString(rowKey) ? get(row, rowKey) : row?._id ?? row?.id;
    if (!type.isNone(key)) return type.isObject(key) ? JSON.stringify(key) : key;
    let fallback = generated.get(row);
    if (type.isUndefined(fallback)) {
      counter += 1;
      fallback = `__row_${counter}`;
      generated.set(row, fallback);
    }
    return fallback;
  };
}

export default createRowKeyGetter;
