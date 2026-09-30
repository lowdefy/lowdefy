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

// A row with a partial patch merged in deeply: plain objects merge key by key at every depth,
// anything else (values, arrays, dates) replaces. Only the objects on a changed path are copied,
// so the rest of the row keeps its identity. `undefined` in the patch leaves the row's value.
// A deep merge never removes a key: a key the patch leaves out keeps the row's value. Rows that
// can lose keys (a change stream's fullDocument after an $unset) are sent whole, with the
// default shallow merge.
function mergeRowPatch({ row, patch }) {
  if (!type.isObject(row) || !type.isObject(patch)) return patch;
  const merged = { ...row };
  Object.keys(patch).forEach((key) => {
    const value = patch[key];
    if (type.isUndefined(value)) return;
    merged[key] =
      type.isObject(value) && type.isObject(row[key])
        ? mergeRowPatch({ row: row[key], patch: value })
        : value;
  });
  return merged;
}

export default mergeRowPatch;
