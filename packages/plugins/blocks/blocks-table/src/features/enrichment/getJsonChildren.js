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

function joinPath(path, key) {
  return path === '' ? String(key) : `${path}.${key}`;
}

// One level of a JSON tree (the cell details panel's raw result): the entries of an object or
// array, each `{ key, path, value, expandable }`, where `path` is the dot path from the root
// (array indices as numbers, `people.0.name`, the form `get` and extract columns read). Only the
// first `limit` entries are returned, with the total, so a huge object renders a page at a time.
function getJsonChildren({ value, path, limit = Infinity }) {
  let entries = [];
  if (type.isArray(value)) {
    entries = value.map((item, index) => [index, item]);
  } else if (type.isObject(value)) {
    entries = Object.entries(value);
  }
  return {
    total: entries.length,
    children: entries.slice(0, limit).map(([key, item]) => ({
      key: String(key),
      path: joinPath(path, key),
      value: item,
      expandable: (type.isArray(item) || type.isObject(item)) && Object.keys(item).length > 0,
    })),
  };
}

export default getJsonChildren;
