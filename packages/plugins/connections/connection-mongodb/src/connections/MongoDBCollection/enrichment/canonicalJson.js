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

const OBJECT_ID_HEX = /^[0-9a-fA-F]{24}$/;

// An ObjectId from the driver, recognised without importing it, so the browser copy of this
// function has no dependencies.
function isObjectId(value) {
  return value._bsontype === 'ObjectId' && typeof value.toHexString === 'function';
}

// An ObjectId as it reaches the browser: { _oid: <hex> }.
function isObjectIdMarker(value) {
  const keys = Object.keys(value);
  return (
    keys.length === 1 &&
    keys[0] === '_oid' &&
    typeof value._oid === 'string' &&
    OBJECT_ID_HEX.test(value._oid)
  );
}

function isDropped(value) {
  return value === undefined || typeof value === 'function' || typeof value === 'symbol';
}

// The canonical JSON text of a value, the same for the same data on the server and in the
// browser: object keys sorted (by UTF-16 code units, as Array.prototype.sort does) at every
// depth, no whitespace, Dates as ISO strings (an invalid Date as null), ObjectIds and
// { _oid } markers as lowercase 24 character hex strings, and undefined values dropped from
// objects. Arrays keep their order, and an undefined item is null, as in JSON.stringify.
// Scalars print as JSON.stringify prints them (NaN and Infinity as null, -0 as 0), a bigint as
// its digits, unquoted (as the number with those digits), and an object with toJSON (a
// Decimal128 or Binary) as its JSON form, which is what the browser receives: the browser copy
// (blocks-antd toCanonicalJson) does the same, and the shared fixture covers both.
function canonicalJson(value) {
  if (isDropped(value)) return undefined;
  if (value === null) return 'null';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'null' : JSON.stringify(value.toISOString());
  }
  if (isObjectId(value)) return JSON.stringify(value.toHexString().toLowerCase());
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item) ?? 'null').join(',')}]`;
  }
  if (isObjectIdMarker(value)) return JSON.stringify(value._oid.toLowerCase());
  if (typeof value.toJSON === 'function') return canonicalJson(value.toJSON());
  const members = Object.keys(value)
    .sort()
    .flatMap((key) => {
      const text = canonicalJson(value[key]);
      return text === undefined ? [] : [`${JSON.stringify(key)}:${text}`];
    });
  return `{${members.join(',')}}`;
}

export default canonicalJson;
