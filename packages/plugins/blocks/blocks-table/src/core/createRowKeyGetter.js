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

import createAccessor from './createAccessor.js';

// Rows without a key field get a stable key per object. They keep it for as long as the object
// lives, so a refetch that returns new objects gives them new keys (documented behaviour).
function createRowKeyGetter({ rowKey }) {
  const readConfigured = type.isString(rowKey) ? createAccessor(rowKey) : null;
  const fallbackKeys = new WeakMap();
  let counter = 0;

  function getKey(row) {
    if (readConfigured) {
      const key = readConfigured(row);
      if (!type.isNone(key)) return key;
    } else {
      if (!type.isNone(row?._id)) return row._id;
      if (!type.isNone(row?.id)) return row.id;
    }
    if (!type.isObject(row)) return `__lf_row_${counter++}`;
    let key = fallbackKeys.get(row);
    if (type.isUndefined(key)) {
      key = `__lf_row_${counter++}`;
      fallbackKeys.set(row, key);
    }
    return key;
  }

  return getKey;
}

export default createRowKeyGetter;
