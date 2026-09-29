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
import { get, type } from '@lowdefy/helpers';

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import createFieldAccessor from './createFieldAccessor.js';
import isEmptyValue from './isEmptyValue.js';

const WITHIN_UNITS = new Set(['day', 'week', 'month', 'year']);

function resolveDynamic({ value, user }) {
  if (type.isObject(value) && type.isString(value.$user)) {
    return get(user, value.$user);
  }
  if (type.isArray(value)) {
    return value.map((item) => resolveDynamic({ value: item, user }));
  }
  return value;
}

// Array items that are records (people, relations) are compared by their id,
// so `in: [id1, id2]` works on `[{ _id, name }]` values.
// `typeof` first: text and tag tests call these once per row, and most values are primitives.
function itemKey(item) {
  if (typeof item !== 'object' || item === null || !type.isObject(item)) return item;
  return item._id ?? item.id ?? item.value ?? item.name ?? item.label;
}

// Text operators read a record by its label, so `contains: acme` matches a
// relation to "Acme Ltd".
function itemLabel(item) {
  if (typeof item !== 'object' || item === null || !type.isObject(item)) return item;
  return item.label ?? item.name ?? item.title ?? itemKey(item);
}

function lower(value) {
  if (typeof value === 'string') return value.toLowerCase();
  return String(value ?? '').toLowerCase();
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// A value's timestamp, as dayjs reads it (date-only strings are local midnight). Numbers, Dates
// and date-only strings skip dayjs: date filters parse every row's value.
function toTime(value) {
  if (isEmptyValue(value)) return NaN;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const match = DATE_ONLY.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  }
  const date = dayjs(value);
  return date.isValid() ? date.valueOf() : NaN;
}

// toTime memoised for one compiled test: a date column repeats the same strings across rows.
const TIME_CACHE_LIMIT = 50000;

function createTimeReader() {
  const cache = new Map();
  return function readTime(value) {
    if (typeof value !== 'string') return toTime(value);
    let time = cache.get(value);
    if (time === undefined) {
      time = toTime(value);
      if (cache.size < TIME_CACHE_LIMIT) cache.set(value, time);
    }
    return time;
  };
}

function scalarEqual({ a, b, family }) {
  if (type.isNone(a) || type.isNone(b)) return type.isNone(a) && type.isNone(b);
  if (family === 'date') {
    const left = dayjs(a);
    const right = dayjs(b);
    return left.isValid() && right.isValid() && left.isSame(right, 'day');
  }
  if (family === 'number') return Number(a) === Number(b);
  const left = itemKey(a);
  const right = itemKey(b);
  if (type.isString(left) || type.isString(right)) return lower(left) === lower(right);
  return left === right;
}

function valueEqual({ a, b, family }) {
  if (type.isArray(a)) {
    if (type.isArray(b)) {
      return (
        a.length === b.length && a.every((item, i) => scalarEqual({ a: item, b: b[i], family }))
      );
    }
    return a.length === 1 && scalarEqual({ a: a[0], b, family });
  }
  return scalarEqual({ a, b, family });
}

// Membership and equality tests run once per row, so their comparison value is reduced to a key
// at compile time. Two values get the same key exactly when scalarEqual finds them equal; values
// with no such key (records without an id, NaN) take the scalarEqual path instead.
const NONE_KEY = Symbol('none');
const INVALID_KEY = Symbol('invalid');
const UNKEYED = Symbol('unkeyed');

// Lowercased strings for keys, memoised: tag, status and owner columns repeat a few values
// across every row, and lowercasing allocates.
const LOWER_CACHE_LIMIT = 10000;
const lowerCache = new Map();

function lowerKey(value) {
  let key = lowerCache.get(value);
  if (key === undefined) {
    key = value.toLowerCase();
    if (lowerCache.size >= LOWER_CACHE_LIMIT) lowerCache.clear();
    lowerCache.set(value, key);
  }
  return key;
}

function scalarKey({ value, family }) {
  if (value === null || value === undefined) return NONE_KEY;
  if (family === 'date') {
    const time = toTime(value);
    if (Number.isNaN(time)) return INVALID_KEY;
    const day = new Date(time);
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  }
  if (family === 'number') {
    const n = Number(value);
    return Number.isNaN(n) ? INVALID_KEY : n;
  }
  const kind = typeof value;
  if (kind === 'string') return lowerKey(value);
  if (kind === 'boolean') return value ? 'true' : 'false';
  if (kind === 'number') return Number.isNaN(value) ? UNKEYED : String(value);
  const key = itemKey(value);
  const keyKind = typeof key;
  if (
    keyKind === 'string' ||
    keyKind === 'boolean' ||
    (keyKind === 'number' && !Number.isNaN(key))
  ) {
    return String(key).toLowerCase();
  }
  return UNKEYED;
}

function createScalarEqualTest({ b, family }) {
  const bKey = scalarKey({ value: b, family });
  if (bKey === INVALID_KEY) return () => false;
  if (bKey === UNKEYED) return (a) => scalarEqual({ a, b, family });
  return (a) => {
    const aKey = scalarKey({ value: a, family });
    if (aKey === UNKEYED) return scalarEqual({ a, b, family });
    return aKey === bKey;
  };
}

// valueEqual with `b` fixed at compile time.
function createEqualTest({ b, family }) {
  if (type.isArray(b)) return (a) => valueEqual({ a, b, family });
  const equalsB = createScalarEqualTest({ b, family });
  return (a) => {
    if (type.isArray(a)) return a.length === 1 && equalsB(a[0]);
    return equalsB(a);
  };
}

// inList with the list fixed at compile time: keyed candidates in a Set.
function createListTest({ list, family }) {
  const candidates = type.isArray(list) ? list : [list];
  const keys = new Set();
  const unkeyed = [];
  candidates.forEach((candidate) => {
    const key = scalarKey({ value: candidate, family });
    if (key === UNKEYED) {
      unkeyed.push(candidate);
    } else if (key !== INVALID_KEY) {
      keys.add(key);
    }
  });
  function matchesItem(item) {
    const key = scalarKey({ value: item, family });
    if (key === UNKEYED) {
      return candidates.some((candidate) => scalarEqual({ a: item, b: candidate, family }));
    }
    if (key !== INVALID_KEY && keys.has(key)) return true;
    return unkeyed.some((candidate) => scalarEqual({ a: item, b: candidate, family }));
  }
  return (value) => (type.isArray(value) ? value.some(matchesItem) : matchesItem(value));
}

// contains with the search fixed at compile time.
function createContainsTest({ search }) {
  const needle = lower(search);
  const equalsSearch = createScalarEqualTest({ b: search, family: 'text' });
  return (value) => {
    if (isEmptyValue(value)) return false;
    if (type.isArray(value)) {
      return value.some((item) => equalsSearch(item) || lower(itemLabel(item)) === needle);
    }
    return lower(itemLabel(value)).includes(needle);
  };
}

// Numbers compare as numbers, dates as timestamps. A `date` column compares by
// day, so `lte: 2026-03-01` includes the whole of 1 March; a `datetime` column
// compares the exact instant.
function createRangeTest({
  lowerBound,
  upperBound,
  lowerInclusive,
  upperInclusive,
  family,
  byDay,
}) {
  function toBound(bound, edge) {
    if (type.isNone(bound)) return undefined;
    if (family !== 'date') return Number(bound);
    const date = dayjs(bound);
    if (!date.isValid()) return NaN;
    if (!byDay) return date.valueOf();
    return edge === 'lower' ? date.startOf('day').valueOf() : date.endOf('day').valueOf();
  }
  // An exclusive lower bound on a day starts after that day ends; an exclusive
  // upper bound ends before that day starts.
  const low = toBound(lowerBound, lowerInclusive ? 'lower' : 'upper');
  const high = toBound(upperBound, upperInclusive ? 'upper' : 'lower');
  const readTime = createTimeReader();
  return (value) => {
    const n = family === 'date' ? readTime(value) : Number(isEmptyValue(value) ? NaN : value);
    if (Number.isNaN(n)) return false;
    if (!type.isUndefined(low)) {
      if (lowerInclusive ? n < low : n <= low) return false;
    }
    if (!type.isUndefined(high)) {
      if (upperInclusive ? n > high : n >= high) return false;
    }
    return true;
  };
}

function createWithinTest({ value, now }) {
  if (!type.isObject(value) || !WITHIN_UNITS.has(value.unit)) {
    throw new Error(
      `Condition operator "within" requires { last: n, unit } or { next: n, unit } with unit day, week, month or year. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  let start;
  let end;
  if (type.isNumber(value.last)) {
    start = now.subtract(value.last, value.unit).startOf('day');
    end = now.endOf('day');
  } else if (type.isNumber(value.next)) {
    start = now.startOf('day');
    end = now.add(value.next, value.unit).endOf('day');
  } else {
    throw new Error(
      `Condition operator "within" requires a number in "last" or "next". Received ${JSON.stringify(
        value
      )}.`
    );
  }
  const low = start.valueOf();
  const high = end.valueOf();
  const readTime = createTimeReader();
  return (cellValue) => {
    const time = readTime(cellValue);
    return !Number.isNaN(time) && time >= low && time <= high;
  };
}

function createTest({ op, value, family, byDay, now }) {
  switch (op) {
    case 'eq':
      return createEqualTest({ b: value, family });
    case 'ne': {
      const equals = createEqualTest({ b: value, family });
      return (cellValue) => !equals(cellValue);
    }
    case 'in':
      return createListTest({ list: value, family });
    case 'nin': {
      const listed = createListTest({ list: value, family });
      return (cellValue) => !listed(cellValue);
    }
    case 'empty':
      return (cellValue) => isEmptyValue(cellValue);
    case 'notEmpty':
      return (cellValue) => !isEmptyValue(cellValue);
    case 'contains':
      return createContainsTest({ search: value });
    case 'notContains': {
      const containsSearch = createContainsTest({ search: value });
      return (cellValue) => !containsSearch(cellValue);
    }
    case 'startsWith': {
      const prefix = lower(value);
      return (cellValue) =>
        !isEmptyValue(cellValue) && lower(itemLabel(cellValue)).startsWith(prefix);
    }
    case 'endsWith': {
      const suffix = lower(value);
      return (cellValue) =>
        !isEmptyValue(cellValue) && lower(itemLabel(cellValue)).endsWith(suffix);
    }
    case 'gt':
    case 'after':
      return createRangeTest({ lowerBound: value, lowerInclusive: false, family, byDay });
    case 'gte':
      return createRangeTest({ lowerBound: value, lowerInclusive: true, family, byDay });
    case 'lt':
    case 'before':
      return createRangeTest({ upperBound: value, upperInclusive: false, family, byDay });
    case 'lte':
      return createRangeTest({ upperBound: value, upperInclusive: true, family, byDay });
    case 'between':
      if (!type.isArray(value) || value.length !== 2) {
        throw new Error(
          `Condition operator "between" requires a [from, to] array. Received ${JSON.stringify(
            value
          )}.`
        );
      }
      return createRangeTest({
        lowerBound: value[0],
        upperBound: value[1],
        lowerInclusive: true,
        upperInclusive: true,
        family,
        byDay,
      });
    case 'within':
      return createWithinTest({ value, now });
    case 'isTrue':
      return (cellValue) => cellValue === true;
    case 'isFalse':
      return (cellValue) => cellValue !== true;
    default:
      throw new Error(`Unknown condition operator "${op}".`);
  }
}

function compileLeaf({ leaf, columnsByKey, column, user, now }) {
  if (!type.isString(leaf.op)) {
    throw new Error(
      `Condition requires an "op", or an "and" or "or" list. Received ${JSON.stringify(leaf)}.`
    );
  }
  const hasKey = !type.isNone(leaf.key);
  const target = hasKey ? columnsByKey?.[leaf.key] : column;
  const cellType = target?.type ?? 'text';
  // A key that names no column is read as a field path, so row rules can test
  // fields the table does not show.
  const field = target?.field ?? leaf.key;
  const family = CELL_TYPE_FAMILIES[cellType] === 'array' ? 'text' : CELL_TYPE_FAMILIES[cellType];
  const test = createTest({
    op: leaf.op,
    value: resolveDynamic({ value: leaf.value, user }),
    family,
    byDay: cellType === 'date',
    now,
  });
  if (hasKey) {
    const read = createFieldAccessor(field);
    return (row) => test(read(row));
  }
  return (row, value) => test(value);
}

function compileNode({ condition, columnsByKey, column, user, now }) {
  if (type.isNone(condition)) return () => true;
  if (!type.isObject(condition)) {
    throw new Error(`Condition must be an object. Received ${JSON.stringify(condition)}.`);
  }
  if (!type.isUndefined(condition.and) || !type.isUndefined(condition.or)) {
    const isAnd = !type.isUndefined(condition.and);
    const list = isAnd ? condition.and : condition.or;
    if (!type.isArray(list)) {
      throw new Error(
        `Condition "${
          isAnd ? 'and' : 'or'
        }" must be a list of conditions. Received ${JSON.stringify(list)}.`
      );
    }
    const tests = list.map((child) =>
      compileNode({ condition: child, columnsByKey, column, user, now })
    );
    // An empty group constrains nothing, whichever kind it is.
    if (tests.length === 0) return () => true;
    if (isAnd) return (row, value) => tests.every((test) => test(row, value));
    return (row, value) => tests.some((test) => test(row, value));
  }
  if (Object.keys(condition).length === 0) return () => true;
  return compileLeaf({ leaf: condition, columnsByKey, column, user, now });
}

// Compiles a condition once into `(row, value) => boolean`. `value` is the
// value of the column the condition belongs to (for column rules and button
// `when`); a leaf without `key` tests it, typed by `column`. A leaf with `key`
// reads that column's field from the row. `{ $user: path }` values resolve
// from `user` at compile time, and `within` is relative to `now` (default the
// current time). Text comparisons ignore case.
function compileCondition({ condition, columnsByKey, column, user, now }) {
  return compileNode({
    condition,
    columnsByKey,
    column,
    user,
    now: dayjs(now ?? new Date()),
  });
}

export default compileCondition;
