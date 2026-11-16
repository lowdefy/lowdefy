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

// The driver's own check, so a Decimal128 from another copy of the bson package is still
// recognised.
function isDecimal128(value) {
  return value?._bsontype === 'Decimal128';
}

// JSON.stringify hands the replacer the value after its toJSON, which for a Decimal128 is the
// driver's { $numberDecimal }; `this[key]` is the value before it.
function replacer(key, value) {
  const raw = this[key];
  if (isDecimal128(raw)) {
    return { '~dec': raw.toString() };
  }
  return value;
}

// Stored documents as plain JSON values, the way a MongoDB request answers with them: an ObjectId
// as its hex string, a Date as its ISO string and a Decimal128 as { '~dec': '<decimal string>' },
// the marker requests read and write (connection-mongodb's serialize.js), so the value a check
// expects is the value a page reads.
function toDocumentJson(documents) {
  return JSON.parse(JSON.stringify(documents, replacer));
}

export default toDocumentJson;
