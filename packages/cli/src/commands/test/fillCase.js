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

function isPlaceholder(value) {
  return type.isObject(value) && Object.keys(value).length === 1 && Object.hasOwn(value, '_case');
}

// `value` with each `{ _case: <key> }` in it replaced by that key of the row, anywhere in it.
// Returns { value, missing }: `missing` lists the keys a placeholder read that the row lacks. A
// filled-in value is taken as written: a `_case` inside a row's value is not filled again.
function fillCase({ value, row }) {
  const missing = [];
  function fill(entry) {
    if (isPlaceholder(entry)) {
      const key = entry._case;
      if (!type.isString(key) || !Object.hasOwn(row, key)) {
        missing.push(key);
        return entry;
      }
      return row[key];
    }
    if (type.isArray(entry)) {
      return entry.map(fill);
    }
    if (type.isObject(entry)) {
      return Object.fromEntries(Object.entries(entry).map(([key, child]) => [key, fill(child)]));
    }
    return entry;
  }
  return { value: fill(value), missing };
}

export default fillCase;
