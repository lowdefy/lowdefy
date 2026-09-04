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

import normaliseTrace from './normaliseTrace.js';
import parseTraceEvent from './parseTraceEvent.js';
import { traceJsonl } from './testTrace.js';

test('normaliseTrace drops bounced and all-pending records and counts both', () => {
  const { dropped } = normaliseTrace({ trace: traceJsonl });
  expect(dropped).toEqual({ bounced: 1, pending: 1, unparsable: 0 });
});

test('normaliseTrace groups by session and page instance, ordered by time', () => {
  const { sessions } = normaliseTrace({ trace: traceJsonl });
  expect(sessions.map((session) => session.session_id)).toEqual(['s-a', 's-b', 's-c']);
  expect(sessions[0].page_instance).toBe('pi-a');
  expect(sessions[0].page_id).toBe('orders');
  const times = sessions[0].events.map((event) => event.t);
  expect([...times].sort()).toEqual(times);
});

test('normaliseTrace orders events by time when the trace file does not', () => {
  const rows = [
    {
      block_id: 'b',
      event_name: 'onClick',
      page_id: 'p',
      session_id: 's',
      t: '2026-01-01T00:00:02.000Z',
      actions: [{ outcome: 'ok' }],
    },
    {
      block_id: 'a',
      event_name: 'onClick',
      page_id: 'p',
      session_id: 's',
      t: '2026-01-01T00:00:01.000Z',
      actions: [{ outcome: 'ok' }],
    },
  ];
  const { sessions } = normaliseTrace({ trace: rows });
  expect(sessions[0].events.map((event) => event.block_id)).toEqual(['a', 'b']);
});

test('normaliseTrace counts a line that is not JSON and keeps the rest of the trace', () => {
  const trace = `${traceJsonl}\n{"session_id": "truncated"`;
  const { dropped, sessions } = normaliseTrace({ trace });
  expect(dropped.unparsable).toBe(1);
  expect(sessions).toHaveLength(3);
});

test('normaliseTrace ignores log lines that are not trace events', () => {
  const trace = ['{"event":"request_completed","rid":"r1"}', '{"not":"an event"}'].join('\n');
  expect(normaliseTrace({ trace }).sessions).toEqual([]);
});

test('normaliseTrace throws when the trace is neither JSONL text nor rows', () => {
  expect(() => normaliseTrace({ trace: 42 })).toThrow(
    'Journey compiler requires a trace as JSONL text or an array of rows. Received 42.'
  );
});

test('parseTraceEvent reads a nested browser error and a flat sink error the same way', () => {
  const row = {
    block_id: 'submit',
    event_name: 'onClick',
    page_id: 'orders',
    session_id: 's',
    success: false,
    error: { config_key: 'k1', name: 'RequestError' },
  };
  const nested = parseTraceEvent(row);
  const flat = parseTraceEvent({
    block_id: 'submit',
    config_key: 'k1',
    error_name: 'RequestError',
    event_name: 'onClick',
    page_id: 'orders',
    session_id: 's',
  });
  expect(nested.error).toEqual({ config_key: 'k1', name: 'RequestError' });
  expect(flat.error).toEqual(nested.error);
  expect(flat.success).toBe(false);
});

test('parseTraceEvent treats a line with no success field and no error as a success', () => {
  const event = parseTraceEvent({
    block_id: 'submit',
    event_name: 'onClick',
    page_id: 'orders',
    session_id: 's',
  });
  expect(event.success).toBe(true);
  expect(event.error).toBe(null);
});
