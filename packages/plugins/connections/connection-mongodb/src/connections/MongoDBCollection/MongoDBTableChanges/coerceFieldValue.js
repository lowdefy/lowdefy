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

function isScalar(value) {
  return type.isString(value) || type.isNumber(value) || value instanceof ObjectId;
}

function coerceText(value) {
  return isScalar(value) ? value : undefined;
}

function coerceNumber(value) {
  if (type.isNumber(value)) return value;
  if (type.isString(value) && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function coerceDate(value) {
  if (type.isDate(value)) return value;
  if ((type.isString(value) && value.trim() !== '') || type.isNumber(value)) {
    const date = new Date(value);
    if (type.isDate(date)) return date;
  }
  return undefined;
}

function coerceBoolean(value) {
  return type.isBoolean(value) ? value : undefined;
}

function coerceArray(value) {
  if (type.isArray(value) && value.every(isScalar)) return value;
  return undefined;
}

// avatar, image and json cells may hold documents. Their keys are data, but a key starting
// with "$" would be an operator if the value ever reached a query or an update expression.
function hasOperatorKey(value) {
  if (type.isArray(value)) return value.some(hasOperatorKey);
  if (!type.isObject(value)) return false;
  return Object.entries(value).some(([key, item]) => key.startsWith('$') || hasOperatorKey(item));
}

function isDocumentValue(value) {
  return (
    isScalar(value) ||
    type.isBoolean(value) ||
    type.isDate(value) ||
    type.isArray(value) ||
    type.isObject(value)
  );
}

function coerceOther(value) {
  if (!isDocumentValue(value) || hasOperatorKey(value)) return undefined;
  return value;
}

const coercers = {
  text: { coerce: coerceText, expected: 'a string or number' },
  numeric: { coerce: coerceNumber, expected: 'a number' },
  date: { coerce: coerceDate, expected: 'a date' },
  boolean: { coerce: coerceBoolean, expected: 'a boolean' },
  array: { coerce: coerceArray, expected: 'an array of strings or numbers' },
  other: { coerce: coerceOther, expected: 'a value without keys starting with "$"' },
};

// A changed value as the field's type. null clears a cell for every type. An object reaches
// only avatar, image and json fields, and never with an operator key.
function coerceFieldValue({ field, value, location }) {
  if (value === null) return null;
  const { coerce, expected } = coercers[field.family];
  const coerced = coerce(value);
  if (type.isUndefined(coerced)) {
    throw new Error(
      `MongoDBTableChanges ${location}: "${field.key}" expects ${expected} for type "${
        field.type
      }". Received ${JSON.stringify(value)}.`
    );
  }
  return coerced;
}

export default coerceFieldValue;
