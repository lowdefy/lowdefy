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

import { ObjectId } from 'mongodb';
import { type } from '@lowdefy/helpers';

import getZonedMidnight from './getZonedMidnight.js';

function coerceNumber(value) {
  if (type.isNumber(value)) {
    return value;
  }
  if (type.isString(value) && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// A date-only value ("2026-03-01", as the Table's date filters send) is the start of that day
// in the time zone; anything else is the instant it names.
function coerceDate(value, timeZone) {
  if (type.isDate(value)) {
    return value;
  }
  const dateOnly = type.isString(value) ? DATE_ONLY.exec(value) : null;
  if (dateOnly !== null) {
    const [, year, month, day] = dateOnly.map(Number);
    const calendar = new Date(Date.UTC(year, month - 1, day));
    if (calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) {
      return undefined;
    }
    return getZonedMidnight({ year, month, day, timeZone });
  }
  if (type.isString(value) || type.isNumber(value)) {
    const date = new Date(value);
    if (type.isDate(date)) {
      return date;
    }
  }
  return undefined;
}

function coerceValue(value) {
  if (type.isString(value) || type.isNumber(value) || value instanceof ObjectId) {
    return value;
  }
  return undefined;
}

function coerceAny(value) {
  if (type.isBoolean(value)) {
    return value;
  }
  return coerceValue(value);
}

const coercers = {
  numeric: { coerce: coerceNumber, expected: 'a number' },
  date: { coerce: coerceDate, expected: 'a date' },
  boolean: {
    coerce: (value) => (type.isBoolean(value) ? value : undefined),
    expected: 'a boolean',
  },
  text: { coerce: coerceValue, expected: 'a string or number' },
  array: { coerce: coerceValue, expected: 'a string or number' },
  other: { coerce: coerceAny, expected: 'a string, number or boolean' },
};

// Every value that reaches the query is a scalar of the field's type, so an object such
// as { $gt: '' } or { $where: '...' } can never be read as a MongoDB operator.
function coerceScalar({ field, op, value, timeZone }) {
  const { coerce, expected } = coercers[field.family];
  const coerced = coerce(value, timeZone);
  if (type.isUndefined(coerced)) {
    throw new Error(
      `MongoDBTableQuery filter on "${field.key}": operator "${op}" expects ${expected} for type "${
        field.type
      }". Received ${JSON.stringify(value)}.`
    );
  }
  return coerced;
}

export default coerceScalar;
