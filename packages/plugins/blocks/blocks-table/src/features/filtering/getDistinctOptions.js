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
import isEmptyValue from '@lowdefy/blocks-antd/table/isEmptyValue.js';

import createColumnAccessor from '../../core/createColumnAccessor.js';

const LIMIT = 1000;

// Records (people, relations) filter by their id, the way the condition compares them.
function toOption(item) {
  if (!type.isObject(item)) return { value: item, label: String(item) };
  const value = item._id ?? item.id ?? item.value ?? item.name ?? item.label;
  return { value, label: String(item.name ?? item.label ?? item.title ?? value) };
}

// A column's distinct values as filter options, for option-style columns without declared
// `options` (tags, people, statuses from data). Array values count each item. Capped, so a column
// of unique values does not build a 100k-item list.
function getDistinctOptions({ rows, column }) {
  const accessor = createColumnAccessor(column);
  const seen = new Map();
  for (let i = 0; i < rows.length && seen.size < LIMIT; i++) {
    const value = accessor(rows[i].original);
    const items = type.isArray(value) ? value : [value];
    items.forEach((item) => {
      if (isEmptyValue(item)) return;
      const option = toOption(item);
      if (!seen.has(option.value)) seen.set(option.value, option);
    });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export default getDistinctOptions;
