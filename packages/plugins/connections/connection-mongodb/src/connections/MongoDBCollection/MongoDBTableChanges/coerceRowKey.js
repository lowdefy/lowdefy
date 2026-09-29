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

// The Table keys a row whose key is an object by its JSON text, so an ObjectId `_id` (sent to
// the browser as { _oid }) comes back as the string '{"_oid":"<hex>"}'.
const OBJECT_ID_KEY = /^\{"_oid":"([0-9a-fA-F]{24})"\}$/;
const OBJECT_ID_HEX = /^[0-9a-fA-F]{24}$/;

function fromObjectIdKey(value) {
  const match = OBJECT_ID_KEY.exec(value);
  return match === null ? undefined : ObjectId.createFromHexString(match[1]);
}

// The number a string is the text of, exactly as String(number) prints it: the Table's key 5
// becomes "5" as an `updated` or `moved` object key. "05", "1e3" and " 5" stay strings.
function fromNumberText(value) {
  const number = Number(value);
  return Number.isFinite(number) && String(number) === value ? number : undefined;
}

// Numeric keys are canonical numbers, whichever part of the changeset they came from, so the
// object key "5" and the array value 5 are one row; getKeyForms matches both forms of it.
function coerceAuto(value) {
  if (value instanceof ObjectId || type.isNumber(value)) return value;
  if (type.isString(value) && value !== '') {
    return fromObjectIdKey(value) ?? fromNumberText(value) ?? value;
  }
  return undefined;
}

function coerceObjectId(value) {
  if (value instanceof ObjectId) return value;
  if (!type.isString(value)) return undefined;
  if (OBJECT_ID_HEX.test(value)) return ObjectId.createFromHexString(value);
  return fromObjectIdKey(value);
}

function coerceString(value) {
  return type.isString(value) && value !== '' ? value : undefined;
}

// Object keys are strings, so an `updated` or `moved` key of a numeric id arrives as "5".
function coerceNumber(value) {
  if (type.isNumber(value)) return value;
  if (type.isString(value) && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

const coercers = {
  auto: { coerce: coerceAuto, expected: 'a string, number or ObjectId' },
  objectId: { coerce: coerceObjectId, expected: 'an ObjectId' },
  string: { coerce: coerceString, expected: 'a non-empty string' },
  number: { coerce: coerceNumber, expected: 'a number' },
};

// Every row key reaches MongoDB as a scalar, only ever as a value in an equality match, so a
// key such as { $ne: null } can never widen a write to other documents.
function coerceRowKey({ value, rowKeyType, part }) {
  const { coerce, expected } = coercers[rowKeyType];
  const coerced = coerce(value);
  if (type.isUndefined(coerced)) {
    throw new Error(
      `MongoDBTableChanges "${part}" has an invalid row key: expected ${expected} (rowKeyType "${rowKeyType}"). Received ${JSON.stringify(
        value
      )}.`
    );
  }
  return coerced;
}

export default coerceRowKey;
