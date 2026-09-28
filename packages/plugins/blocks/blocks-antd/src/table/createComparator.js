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

import dayjs from 'dayjs';
import { type } from '@lowdefy/helpers';

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import getOptionsMap from './getOptionsMap.js';
import isEmptyValue from './isEmptyValue.js';

// One collator for every text sort: creating one per compare is the slow part
// of localeCompare. `numeric` sorts "Item 2" before "Item 10".
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function itemText(item) {
  if (type.isObject(item)) {
    return String(item.label ?? item.name ?? item.title ?? item._id ?? item.id ?? '');
  }
  return String(item);
}

function toText({ value, optionsMap }) {
  const items = type.isArray(value) ? value : [value];
  return items
    .map((item) => {
      const option = type.isPrimitive(item) ? optionsMap.get(item) : undefined;
      return option ? option.label : itemText(item);
    })
    .join(', ');
}

// A typed sort key, or null for an empty value (which always sorts last).
function createKeyGetter({ family, options }) {
  const optionsMap = getOptionsMap(options);
  switch (family) {
    case 'number':
      return (value) => {
        if (isEmptyValue(value)) return null;
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
      };
    case 'date':
      return (value) => {
        if (isEmptyValue(value)) return null;
        const date = dayjs(value);
        return date.isValid() ? date.valueOf() : null;
      };
    case 'boolean':
      return (value) => (type.isNone(value) ? null : Number(value === true));
    case 'action':
      return () => 0;
    default:
      if (optionsMap.size > 0 && family === 'text') {
        // Enum columns sort in the order their options are declared (a pipeline
        // stage order, not the alphabet); values without an option come after.
        return (value) => {
          if (isEmptyValue(value)) return null;
          const option = type.isPrimitive(value) ? optionsMap.get(value) : undefined;
          if (option) return option.index;
          return toText({ value, optionsMap });
        };
      }
      return (value) => {
        if (isEmptyValue(value)) return null;
        if (family === 'other' && !type.isPrimitive(value)) return JSON.stringify(value);
        return toText({ value, optionsMap });
      };
  }
}

// A comparator over two cell values of this column, typed by the column's cell
// type: numbers numerically, dates by time, enums by option order, text with a
// shared collator (case- and accent-insensitive, numeric-aware). Empty values
// sort last in both directions, so pass `desc` rather than negating the result.
function createComparator({ column, desc = false }) {
  const family = CELL_TYPE_FAMILIES[column.type ?? 'text'];
  if (type.isUndefined(family)) {
    throw new Error(`Unknown table cell type "${column.type}".`);
  }
  const getKey = createKeyGetter({ family, options: column.options });
  const direction = desc ? -1 : 1;
  return function compare(a, b) {
    const keyA = getKey(a);
    const keyB = getKey(b);
    if (keyA === null || keyB === null) {
      if (keyA === keyB) return 0;
      return keyA === null ? 1 : -1;
    }
    if (type.isString(keyA) && type.isString(keyB)) {
      return direction * collator.compare(keyA, keyB);
    }
    // An enum value with an option (a number rank) comes before one without
    // (its text).
    if (type.isString(keyA) !== type.isString(keyB)) {
      return direction * (type.isString(keyA) ? 1 : -1);
    }
    if (keyA === keyB) return 0;
    return direction * (keyA < keyB ? -1 : 1);
  };
}

export default createComparator;
