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

// The sort key of a cell value for this column: a number (numbers, dates as
// time, booleans as 0/1, enum values as their option position), a string
// (text, compared with compareSortKeys' collator) or null for an empty value,
// which always sorts last. createComparator compares these keys; a host that
// sorts many rows can compute each value's key once and compare the keys with
// compareSortKeys to get the same order.
function createSortKeyGetter({ column }) {
  const family = CELL_TYPE_FAMILIES[column.type ?? 'text'];
  if (type.isUndefined(family)) {
    throw new Error(`Unknown table cell type "${column.type}".`);
  }
  const optionsMap = getOptionsMap(column.options);
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
        // Plain strings are their own text; skipping toText keeps big text sorts cheap.
        if (type.isString(value) && optionsMap.size === 0) return value;
        if (family === 'other' && !type.isPrimitive(value)) return JSON.stringify(value);
        return toText({ value, optionsMap });
      };
  }
}

export default createSortKeyGetter;
