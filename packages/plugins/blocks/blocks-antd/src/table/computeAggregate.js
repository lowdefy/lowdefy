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
import createComparator from './createComparator.js';
import isEmptyValue from './isEmptyValue.js';

function toNumbers(values) {
  const numbers = [];
  values.forEach((value) => {
    if (isEmptyValue(value)) return;
    const n = Number(value);
    if (Number.isFinite(n)) numbers.push(n);
  });
  return numbers;
}

// A loop, not Math.min(...numbers): spreading a large column (150k+ values) overflows the call
// stack.
function pickNumber({ numbers, max }) {
  let best = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (max ? numbers[i] > best : numbers[i] < best) best = numbers[i];
  }
  return best;
}

function distinctKey(value) {
  return type.isPrimitive(value) ? value : JSON.stringify(value);
}

// The first value by the column's own sort order, so min and max work for any
// type: numbers, dates, enums (by option order) and text.
function pickExtreme({ values, column, desc }) {
  const compare = createComparator({ column, desc });
  let best;
  values.forEach((value) => {
    if (isEmptyValue(value)) return;
    if (type.isUndefined(best) || compare(value, best) < 0) best = value;
  });
  return best ?? null;
}

function pickDate({ values, latest }) {
  let best = null;
  let bestTime;
  values.forEach((value) => {
    if (isEmptyValue(value)) return;
    const date = dayjs(value);
    if (!date.isValid()) return;
    const time = date.valueOf();
    if (type.isUndefined(bestTime) || (latest ? time > bestTime : time < bestTime)) {
      best = value;
      bestTime = time;
    }
  });
  return best;
}

// One footer or group calculation over a column's values. Counts count rows,
// sum and avg read the numeric values, min and max follow the column's sort
// order, and earliest and latest compare dates. Returns null when there is
// nothing to calculate (the average or minimum of no values); percentEmpty is
// a fraction from 0 to 1.
function computeAggregate({ fn, values, column }) {
  const list = values ?? [];
  switch (fn) {
    case 'count':
      return list.length;
    case 'countEmpty':
      return list.filter(isEmptyValue).length;
    case 'countNotEmpty':
      return list.filter((value) => !isEmptyValue(value)).length;
    case 'percentEmpty':
      if (list.length === 0) return null;
      return list.filter(isEmptyValue).length / list.length;
    case 'countDistinct':
      return new Set(list.filter((value) => !isEmptyValue(value)).map(distinctKey)).size;
    case 'sum':
      return toNumbers(list).reduce((total, n) => total + n, 0);
    case 'avg': {
      const numbers = toNumbers(list);
      if (numbers.length === 0) return null;
      return numbers.reduce((total, n) => total + n, 0) / numbers.length;
    }
    case 'min':
    case 'max': {
      if (CELL_TYPE_FAMILIES[column?.type] === 'number') {
        const numbers = toNumbers(list);
        if (numbers.length === 0) return null;
        return pickNumber({ numbers, max: fn === 'max' });
      }
      return pickExtreme({ values: list, column: column ?? { type: 'text' }, desc: fn === 'max' });
    }
    case 'earliest':
      return pickDate({ values: list, latest: false });
    case 'latest':
      return pickDate({ values: list, latest: true });
    default:
      throw new Error(`Unknown table aggregate "${fn}".`);
  }
}

export default computeAggregate;
