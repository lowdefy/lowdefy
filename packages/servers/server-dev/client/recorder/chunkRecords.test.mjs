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

import chunkRecords, { MAX_CHUNK_BYTES } from './chunkRecords.js';

function record(session, size = 1000) {
  return { session, t: '2026-10-03T14:03:11.000Z', kind: 'change', value: 'x'.repeat(size) };
}

test('chunkRecords keeps every POST body under 48 KB', () => {
  const records = Array.from({ length: 200 }, () => record('20261003T140311Z-aaaaaa'));
  const chunks = chunkRecords({ records });
  expect(chunks.length).toBeGreaterThan(1);
  chunks.forEach((chunk) => {
    expect(Buffer.byteLength(JSON.stringify(chunk))).toBeLessThanOrEqual(MAX_CHUNK_BYTES);
  });
  expect(chunks.flatMap((chunk) => chunk.records)).toHaveLength(200);
});

test('chunkRecords counts multi-byte characters by their UTF-8 length', () => {
  const records = Array.from({ length: 40 }, () => ({
    session: '20261003T140311Z-aaaaaa',
    value: 'é€😀'.repeat(200),
  }));
  chunkRecords({ records, maxBytes: 8000 }).forEach((chunk) => {
    expect(Buffer.byteLength(JSON.stringify(chunk))).toBeLessThanOrEqual(8000);
  });
});

test('chunkRecords puts one session in each body', () => {
  const chunks = chunkRecords({
    records: [record('20261003T140311Z-aaaaaa', 10), record('20261003T142311Z-bbbbbb', 10)],
  });
  expect(chunks.map((chunk) => chunk.session)).toEqual([
    '20261003T140311Z-aaaaaa',
    '20261003T142311Z-bbbbbb',
  ]);
});

test('chunkRecords drops a single record too large for a body', () => {
  const chunks = chunkRecords({
    records: [record('20261003T140311Z-aaaaaa', 60000), record('20261003T140311Z-aaaaaa', 10)],
  });
  expect(chunks).toHaveLength(1);
  expect(chunks[0].records).toHaveLength(1);
});
