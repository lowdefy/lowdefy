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

import { cell } from '../../static.utils.js';

// Normalise `properties.items` into `{ label, value, key }` rows, mirroring the
// Descriptions block: an object becomes key/value pairs, a primitive item its
// own label and value.
function normalizeItems(items) {
  if (type.isObject(items)) {
    return Object.keys(items).map((key) => ({ label: key, value: items[key], key }));
  }
  if (!type.isArray(items)) return [];
  return items.map((item) => {
    // isPrimitive is true for null and undefined too, so build the label with
    // String() only for real values — undefined.toString() would throw.
    if (type.isPrimitive(item)) {
      return { label: type.isNone(item) ? '' : String(item), value: item, key: `${item}` };
    }
    return { label: item.label ?? item.key, value: item.value, key: item.key ?? item.label };
  });
}

// A cell keeps the raw typed value; numbers also carry a display string so the
// PDF shows the same text while xlsx keeps the number.
function valueCell(value) {
  if (type.isNumber(value)) return cell(value, String(value));
  if (type.isNone(value)) return cell(value);
  return cell(String(value));
}

/**
 * Descriptions → a two-column `table` of label/value rows. `itemOptions`
 * `transformLabel`/`transformValue` functions (from the `_function` operator)
 * run per row so the report matches what the page shows.
 */
export const Descriptions = {
  toReport: ({ block }) => {
    const { items, itemOptions } = block.properties;
    const rows = normalizeItems(items);
    if (rows.length === 0) return null;
    const options = type.isArray(itemOptions) ? itemOptions : [];
    const body = rows.map((row, i) => {
      const option = options.find((o) => type.isObject(o) && o.key === row.key) || {};
      const label = type.isFunction(option.transformLabel)
        ? option.transformLabel(row.label, row, i)
        : row.label;
      const value = type.isFunction(option.transformValue)
        ? option.transformValue(row.value, row, i)
        : row.value;
      return [cell(type.isNone(label) ? '' : String(label)), valueCell(value)];
    });
    // The PDF table model styles its first row as a header; a Descriptions
    // list has no column headers, so emit an empty two-cell header row.
    return { kind: 'table', header: [cell(''), cell('')], rows: body };
  },
};
