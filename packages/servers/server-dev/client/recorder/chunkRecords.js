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

// Keepalive fetches share a 64 KB in-flight budget per page, so each POST body
// stays under 48 KB.
const MAX_CHUNK_BYTES = 48 * 1024;

function utf8Length(text) {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code < 0x10000) {
      bytes += 3;
    } else {
      bytes += 4;
    }
  }
  return bytes;
}

// The bytes of `{"session":…,"records":[]}` before any record is added.
function emptyBodyLength(session) {
  return utf8Length(JSON.stringify({ session, records: [] }));
}

// Splits records into POST bodies of { session, records }, one session per
// body (the route names the file by it) and each body under maxBytes. A
// single record too large for a body on its own is dropped.
function chunkRecords({ records, maxBytes = MAX_CHUNK_BYTES }) {
  const chunks = [];
  let current = null;
  records.forEach((record) => {
    const recordLength = utf8Length(JSON.stringify(record));
    if (current !== null && current.session === record.session) {
      // One comma joins the record to the ones before it.
      const length = current.length + 1 + recordLength;
      if (length <= maxBytes) {
        current.records.push(record);
        current.length = length;
        return;
      }
    }
    if (current !== null) chunks.push({ session: current.session, records: current.records });
    const length = emptyBodyLength(record.session) + recordLength;
    current = length <= maxBytes ? { session: record.session, records: [record], length } : null;
  });
  if (current !== null) chunks.push({ session: current.session, records: current.records });
  return chunks;
}

export { MAX_CHUNK_BYTES };
export default chunkRecords;
