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

import coerceScalar from './coerceScalar.js';
import resolveUserValue from './resolveUserValue.js';

const MAX_LIST_VALUES = 500;
const MAX_WITHIN = 10000;
const withinUnits = ['day', 'week', 'month', 'year'];

function invalid({ field, op, expected, value }) {
  return new Error(
    `MongoDBTableQuery filter on "${
      field.key
    }": operator "${op}" expects ${expected}. Received ${JSON.stringify(value)}.`
  );
}

function parseList({ field, op, value, user, timeZone }) {
  const list = resolveUserValue({ value, user, key: field.key });
  if (!type.isArray(list) || list.length > MAX_LIST_VALUES) {
    throw invalid({ field, op, expected: `an array of at most ${MAX_LIST_VALUES} values`, value });
  }
  return list.map((item) =>
    coerceScalar({
      field,
      op,
      value: resolveUserValue({ value: item, user, key: field.key }),
      timeZone,
    })
  );
}

function parseRange({ field, op, value, user, timeZone }) {
  if (!type.isArray(value) || value.length !== 2 || value.every((bound) => type.isNone(bound))) {
    throw invalid({ field, op, expected: 'an array [from, to] with at least one bound', value });
  }
  return value.map((bound) => {
    if (type.isNone(bound)) {
      return null;
    }
    return coerceScalar({
      field,
      op,
      value: resolveUserValue({ value: bound, user, key: field.key }),
      timeZone,
    });
  });
}

function parseWithin({ field, op, value }) {
  const expected = '{ last | next: positive integer, unit: day | week | month | year }';
  if (!type.isObject(value)) {
    throw invalid({ field, op, expected, value });
  }
  const keys = Object.keys(value);
  const direction = keys.find((key) => key === 'last' || key === 'next');
  const count = value[direction];
  if (
    keys.length !== 2 ||
    type.isUndefined(direction) ||
    !withinUnits.includes(value.unit) ||
    !type.isInt(count) ||
    count < 1 ||
    count > MAX_WITHIN
  ) {
    throw invalid({ field, op, expected, value });
  }
  return { [direction]: count, unit: value.unit };
}

function parseText({ field, op, value, user }) {
  const resolved = resolveUserValue({ value, user, key: field.key });
  if (!type.isString(resolved)) {
    throw invalid({ field, op, expected: 'a string', value });
  }
  return resolved;
}

// Returns the value the compiler uses: resolved from $user, coerced to the field's type
// and checked against the operator's shape.
function parseLeafValue({ field, op, value, user, timeZone }) {
  switch (op) {
    case 'empty':
    case 'notEmpty':
    case 'isTrue':
    case 'isFalse':
      if (!type.isNone(value)) {
        throw invalid({ field, op, expected: 'no value', value });
      }
      return undefined;
    case 'in':
    case 'nin':
      return parseList({ field, op, value, user, timeZone });
    case 'between':
      return parseRange({ field, op, value, user, timeZone });
    case 'within':
      return parseWithin({ field, op, value });
    case 'contains':
    case 'notContains':
      if (field.family === 'array') {
        return coerceScalar({
          field,
          op,
          value: resolveUserValue({ value, user, key: field.key }),
        });
      }
      return parseText({ field, op, value, user });
    case 'startsWith':
    case 'endsWith':
      return parseText({ field, op, value, user });
    default:
      return coerceScalar({
        field,
        op,
        value: resolveUserValue({ value, user, key: field.key }),
        timeZone,
      });
  }
}

export default parseLeafValue;
