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

import hashEnrichmentInputs from '@lowdefy/blocks-antd/table/hashEnrichmentInputs.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';
import readColumnValue from '@lowdefy/blocks-antd/table/readColumnValue.js';

import createRunCounter from './createRunCounter.js';
import getProgressMode from './getProgressMode.js';
import getProgressParts from './getProgressParts.js';
import getRunState from './getRunState.js';
import readServerRunCounts from './readServerRunCounts.js';

const { columnsByKey } = normalizeColumns({
  columns: [
    'domain',
    { key: 'email', kind: 'enrichment', provider: 'p', inputs: { domain: { column: 'domain' } } },
    { key: 'raw', kind: 'extract', source: 'email', path: 'result.0.email' },
  ],
});
const email = columnsByKey.email;
const hash = hashEnrichmentInputs({ domain: 'acme.com' });

test('getRunState reads the stored status', () => {
  ['queued', 'running', 'ok', 'error', 'empty'].forEach((status) => {
    const row = { domain: 'acme.com', _enrich: { email: { status, inputHash: hash } } };
    expect(getRunState({ column: email, row })).toMatchObject({ status, stale: false });
  });
});

test('getRunState of a cell that never ran is none', () => {
  expect(getRunState({ column: email, row: { domain: 'acme.com' } })).toEqual({
    status: 'none',
    state: null,
    stale: false,
  });
  expect(
    getRunState({ column: email, row: { _enrich: { email: { status: 'odd' } } } }).status
  ).toBe('none');
});

test('getRunState marks a finished cell stale when the inputs changed since it ran', () => {
  const state = { status: 'ok', value: 'a@acme.com', inputHash: hash };
  expect(
    getRunState({ column: email, row: { domain: 'acme.com', _enrich: { email: state } } }).stale
  ).toBe(false);
  expect(
    getRunState({ column: email, row: { domain: 'acme.io', _enrich: { email: state } } }).stale
  ).toBe(true);
  const empty = { status: 'empty', inputHash: hash };
  expect(
    getRunState({ column: email, row: { domain: 'x.io', _enrich: { email: empty } } }).stale
  ).toBe(true);
});

test('getRunState never marks a running cell or a cell without a hash stale', () => {
  const running = { status: 'running', inputHash: hash };
  expect(
    getRunState({ column: email, row: { domain: 'x.io', _enrich: { email: running } } }).stale
  ).toBe(false);
  const noHash = { status: 'ok' };
  expect(
    getRunState({ column: email, row: { domain: 'x.io', _enrich: { email: noHash } } }).stale
  ).toBe(false);
});

test('an extract column reads a path in the source column raw result', () => {
  const row = { _enrich: { email: { raw: { result: [{ email: 'a@acme.com' }] } } } };
  expect(readColumnValue({ column: columnsByKey.raw, row })).toBe('a@acme.com');
  expect(readColumnValue({ column: columnsByKey.raw, row: {} })).toBeUndefined();
});

const phone = { key: 'phone', stateField: '_enrich.phone' };

test('createRunCounter counts each status of each run column over rows', () => {
  const rows = [
    { _enrich: { email: { status: 'running' }, phone: { status: 'ok' } } },
    { _enrich: { email: { status: 'running' } } },
    { _enrich: { email: { status: 'error' } } },
    { _enrich: { email: { status: 'queued' } } },
    { _enrich: { email: { status: 'ok' } } },
    { _enrich: { email: { status: 'unknown' } } },
    { _enrich: {} },
    {},
  ];
  const counts = createRunCounter()({ rows, columns: [email, phone] });
  expect(counts.get('email')).toEqual({ queued: 1, running: 2, ok: 1, error: 1, empty: 0 });
  expect(counts.get('phone')).toEqual({ queued: 0, running: 0, ok: 1, error: 0, empty: 0 });
});

// A row whose _enrich reads are counted, to see which rows a count reads again.
function trackedRow({ reads, status }) {
  const enrich = { email: { status } };
  const row = {};
  Object.defineProperty(row, '_enrich', {
    enumerable: true,
    get() {
      reads.count += 1;
      return enrich;
    },
  });
  return row;
}

test('createRunCounter only reads the rows that changed since its last count', () => {
  const reads = { count: 0 };
  const rows = Array.from({ length: 100 }, () => trackedRow({ reads, status: 'queued' }));
  const count = createRunCounter();
  expect(count({ rows, columns: [email] }).get('email').queued).toBe(100);
  expect(reads.count).toBe(100);
  // A websocket batch replaces two rows; the other 98 keep their identity.
  const next = [...rows];
  next[3] = trackedRow({ reads, status: 'running' });
  next[40] = trackedRow({ reads, status: 'ok' });
  reads.count = 0;
  expect(count({ rows: next, columns: [email] }).get('email')).toEqual({
    queued: 98,
    running: 1,
    ok: 1,
    error: 0,
    empty: 0,
  });
  expect(reads.count).toBe(2);
});

test('createRunCounter reads every row again when the run columns change', () => {
  const reads = { count: 0 };
  const rows = Array.from({ length: 10 }, () => trackedRow({ reads, status: 'ok' }));
  const count = createRunCounter();
  count({ rows, columns: [email] });
  reads.count = 0;
  const counts = count({ rows, columns: [email, phone] });
  expect(reads.count).toBe(20);
  expect(counts.get('email').ok).toBe(10);
  expect(counts.get('phone').ok).toBe(0);
});

test('getProgressParts lists running, queued and errors, toned by the most severe', () => {
  expect(getProgressParts({ running: 12, queued: 0, error: 3, ok: 5, empty: 0 })).toEqual({
    parts: [
      { status: 'running', count: '12', text: '12 running' },
      { status: 'error', count: '3', text: '3 errors' },
    ],
    status: 'error',
    text: '12 running · 3 errors',
    tone: 'error',
  });
  expect(getProgressParts({ running: 2, queued: 120, error: 0, ok: 0, empty: 0 })).toMatchObject({
    text: '2 running · 120 queued',
    status: 'running',
    tone: 'processing',
  });
  expect(getProgressParts({ running: 0, queued: 1, error: 0, ok: 0, empty: 0 })).toMatchObject({
    text: '1 queued',
    tone: 'default',
  });
  expect(getProgressParts({ running: 0, queued: 0, error: 0, ok: 9, empty: 2 })).toBe(null);
});

test('getProgressMode takes the largest chip form that fits beside the title', () => {
  // Every character 6px wide.
  const measure = { smallText: (text) => text.length * 6 };
  const progress = getProgressParts({ running: 3, queued: 1, error: 1, ok: 0, empty: 0 });
  // Full: inset 14 + icon 12 + gap 3 + 30 characters.
  expect(getProgressMode({ progress, measure, room: 209 })).toBe('full');
  // Compact: inset 14 + 3 × (icon 12 + gap 3 + one digit 6) + 2 part gaps of 6.
  expect(getProgressMode({ progress, measure, room: 208 })).toBe('compact');
  expect(getProgressMode({ progress, measure, room: 89 })).toBe('compact');
  expect(getProgressMode({ progress, measure, room: 88 })).toBe('dot');
  expect(getProgressMode({ progress, measure, room: -20 })).toBe('dot');
});

test('readServerRunCounts reads counts from the response aggregates', () => {
  expect(
    readServerRunCounts({ aggregates: { email: { running: 4, error: 1 } }, key: 'email' })
  ).toEqual({
    queued: 0,
    running: 4,
    ok: 0,
    error: 1,
    empty: 0,
  });
  expect(readServerRunCounts({ aggregates: { email: 12 }, key: 'email' })).toBe(null);
  expect(readServerRunCounts({ aggregates: null, key: 'email' })).toBe(null);
});
