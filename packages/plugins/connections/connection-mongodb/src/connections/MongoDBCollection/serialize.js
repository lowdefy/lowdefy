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

import { Decimal128, ObjectId } from 'mongodb';
import { serializer, type } from '@lowdefy/helpers';

// How BSON types that JSON cannot hold cross a request's properties and its response:
// an ObjectId as { _oid: '<hex>' } and a Decimal128 as { _decimal: '<decimal string>' }.
// A decimal is only ever read from and written to a string, so no value passes through a
// JavaScript double on the way.

// The driver's own check, so a Decimal128 from another copy of the bson package (a plugin's,
// through the walled client) is still recognised.
function isDecimal128(value) {
  return value?._bsontype === 'Decimal128';
}

function replaceBsonValue(value) {
  if (value instanceof ObjectId) {
    return { _oid: value.toHexString() };
  }
  if (isDecimal128(value)) {
    return { _decimal: value.toString() };
  }
  return value;
}

function replacer(_, value) {
  if (type.isObject(value)) {
    // Copy before replacing: the object is the caller's own (a plugin's document handed to the
    // walled client, a driver response), and it keeps its BSON values.
    let replaced = value;
    Object.keys(value).forEach((key) => {
      const replacement = replaceBsonValue(value[key]);
      if (replacement !== value[key]) {
        if (replaced === value) {
          replaced = { ...value };
        }
        replaced[key] = replacement;
      }
    });
    return replaced;
  }
  if (type.isArray(value)) {
    return value.map((item) => replaceBsonValue(item));
  }
  return value;
}

function reviveDecimal(value) {
  if (!type.isString(value)) {
    throw new Error(
      `_decimal takes a decimal as a string, such as { _decimal: '12.50' }. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  try {
    return Decimal128.fromString(value);
  } catch (error) {
    throw new Error(
      `_decimal ${JSON.stringify(value)} is not a decimal MongoDB can store exactly: ${
        error.message
      }`,
      { cause: error }
    );
  }
}

function reviver(key, value) {
  if (type.isObject(value)) {
    if (value._oid) {
      return ObjectId.createFromHexString(value._oid);
    }
    if (!type.isUndefined(value._decimal)) {
      return reviveDecimal(value._decimal);
    }
  }
  return value;
}

function serialize(obj) {
  return serializer.copy(obj, { replacer });
}

function deserialize(obj) {
  return serializer.copy(obj, { reviver });
}

export { serialize, deserialize };
