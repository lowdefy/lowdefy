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

import normaliseRecords from './normaliseRecords.js';
import parseTraceLines from './parseTraceLines.js';
import traceRecord from './traceRecord.js';

test('normaliseRecords groups by session, ordered by first time, records ordered by time', () => {
  const { sessions } = normaliseRecords({
    records: [
      traceRecord({ at: 5, session: 's-b', block: 'b2' }),
      traceRecord({ at: 3, session: 's-a', block: 'a2' }),
      traceRecord({ at: 1, session: 's-b', block: 'b1' }),
      traceRecord({ at: 2, session: 's-a', block: 'a1' }),
    ],
  });
  expect(sessions.map((session) => session.session)).toEqual(['s-b', 's-a']);
  expect(sessions[0].records.map((record) => record.target.block_id)).toEqual(['b1', 'b2']);
  expect(sessions[1].records.map((record) => record.target.block_id)).toEqual(['a1', 'a2']);
});

test('normaliseRecords keeps the trace order for records with the same time', () => {
  const { sessions } = normaliseRecords({
    records: [traceRecord({ at: 1, block: 'first' }), traceRecord({ at: 1, block: 'second' })],
  });
  expect(sessions[0].records.map((record) => record.target.block_id)).toEqual(['first', 'second']);
});

test('normaliseRecords counts a record of another version apart from invalid records', () => {
  const { dropped, sessions } = normaliseRecords({
    records: [traceRecord({ block: 'a' }), { ...traceRecord({ block: 'b' }), v: 2 }],
  });
  expect(dropped).toEqual({ invalid: 0, otherVersion: 1, reasons: [] });
  expect(sessions[0].records).toHaveLength(1);
});

test('normaliseRecords counts lines that are not trace records as invalid and keeps five reasons', () => {
  const { dropped, sessions } = normaliseRecords({
    records: [
      { event: 'request_completed', rid: 'r1' },
      { not: 'a record' },
      ...Array.from({ length: 4 }, (_, index) => traceRecord({ at: index, kind: 'click' })),
      traceRecord({ block: 'ok' }),
    ],
  });
  expect(dropped.invalid).toBe(6);
  expect(dropped.reasons).toHaveLength(5);
  expect(dropped.reasons[0]).toBe('Trace record "v" should be 1. Received undefined.');
  expect(sessions).toHaveLength(1);
});

test('normaliseRecords throws when records is not an array', () => {
  expect(() => normaliseRecords({ records: 42 })).toThrow(
    'Journey compiler requires trace records as an array. Received 42.'
  );
});

test('parseTraceLines counts a line that is not JSON and keeps the rest of the trace', () => {
  const text = [
    JSON.stringify(traceRecord({ block: 'a' })),
    '',
    JSON.stringify(traceRecord({ block: 'b' })),
    '{"session": "truncated"',
  ].join('\n');
  const { records, unparsable } = parseTraceLines({ text });
  expect(unparsable).toBe(1);
  expect(records).toHaveLength(2);
});

test('parseTraceLines throws when the trace is not text', () => {
  expect(() => parseTraceLines({ text: 42 })).toThrow(
    'Journey compiler requires a trace as JSONL text. Received 42.'
  );
});
