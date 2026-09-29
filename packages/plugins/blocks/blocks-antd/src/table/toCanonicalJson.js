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

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

// An ObjectId in any of the shapes a row can hold it: the driver's instance (server), or the
// serialised `{ _oid: hex }` (browser).
function toObjectIdHex(value) {
  if (typeof value.toHexString === 'function' && value._bsontype === 'ObjectId') {
    return value.toHexString();
  }
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === '_oid' && typeof value._oid === 'string') {
    if (OBJECT_ID_PATTERN.test(value._oid)) return value._oid.toLowerCase();
  }
  return null;
}

function isDropped(value) {
  return value === undefined || typeof value === 'function' || typeof value === 'symbol';
}

function encode(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'null' : JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => (isDropped(item) ? 'null' : encode(item))).join(',')}]`;
  }
  const objectId = toObjectIdHex(value);
  if (objectId !== null) return JSON.stringify(objectId);
  const parts = [];
  Object.keys(value)
    .sort()
    .forEach((key) => {
      if (isDropped(value[key])) return;
      parts.push(`${JSON.stringify(key)}:${encode(value[key])}`);
    });
  return `{${parts.join(',')}}`;
}

// The canonical JSON of a value, the text enrichment input hashes are computed over. The same
// value always gives the same text, on the browser and the server:
// - object keys sorted (by UTF-16 code units, `Array.prototype.sort`), recursively; no whitespace;
// - `undefined`, function and symbol values are dropped from objects and written `null` in
//   arrays (as JSON.stringify does), so a missing input and an absent key hash alike;
// - Dates are their ISO string; ObjectIds (driver instances or `{ _oid }`) their 24-char
//   lowercase hex string; non-finite numbers `null`; bigints their decimal string;
// - everything else is JSON.stringify's encoding (strings, numbers, booleans, null).
function toCanonicalJson(value) {
  if (isDropped(value)) return 'null';
  return encode(value);
}

export default toCanonicalJson;
