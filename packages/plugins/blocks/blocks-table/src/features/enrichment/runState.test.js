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

import countRunStates from './countRunStates.js';
import formatRunCounts from './formatRunCounts.js';
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

test('countRunStates counts each status of a column over rows', () => {
  const rows = [
    { _enrich: { email: { status: 'running' } } },
    { _enrich: { email: { status: 'running' } } },
    { _enrich: { email: { status: 'error' } } },
    { _enrich: { email: { status: 'queued' } } },
    { _enrich: { email: { status: 'ok' } } },
    { _enrich: {} },
    {},
  ];
  expect(countRunStates({ rows, column: email })).toEqual({
    queued: 1,
    running: 2,
    ok: 1,
    error: 1,
    empty: 0,
  });
});

test('formatRunCounts lists running, queued and errors', () => {
  expect(formatRunCounts({ running: 12, queued: 0, error: 3, ok: 5, empty: 0 })).toBe(
    '12 running · 3 errors'
  );
  expect(formatRunCounts({ running: 0, queued: 120, error: 1, ok: 0, empty: 0 })).toBe(
    '120 queued · 1 error'
  );
  expect(formatRunCounts({ running: 0, queued: 0, error: 0, ok: 9, empty: 2 })).toBe('');
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
