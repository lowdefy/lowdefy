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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import createJsonlAdapter from './createJsonlAdapter.js';

const rows = [
  {
    time: '2026-09-01T10:00:00.000Z',
    event: 'request_completed',
    rid: 'r1',
    page_id: 'orders',
    request_id: 'get_orders',
    config_key: 'key-a',
    duration_ms: 10,
    success: true,
    git_sha: 'sha-1',
  },
  {
    time: '2026-09-01T10:00:01.000Z',
    event: 'request_failed',
    rid: 'r1',
    page_id: 'orders',
    request_id: 'get_orders',
    config_key: 'key-a',
    duration_ms: 90,
    success: false,
    git_sha: 'sha-1',
    error: { name: 'RequestError', message: 'connection refused' },
  },
  {
    time: '2026-09-01T10:00:02.000Z',
    event: 'endpoint_failed',
    rid: 'r2',
    endpoint_id: 'submit',
    // A sink that flattens nested fields writes this spelling instead.
    'error.name': 'ServiceError',
    'error.message': 'upstream 502',
    config_key: 'key-b',
    duration_ms: 300,
    success: false,
    git_sha: 'sha-1',
  },
];

const filePath = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-jsonl-')),
  'events.jsonl'
);
// A saved terminal export interleaves plain stdout with the log lines.
fs.writeFileSync(
  filePath,
  `Listening on http://localhost:3000\n${rows.map((row) => JSON.stringify(row)).join('\n')}\n`
);

const adapter = createJsonlAdapter({ url: pathToFileURL(filePath).href });

test('createJsonlAdapter reads a file:// url and skips non-JSON lines', async () => {
  const result = await adapter.query({});
  expect(result).toHaveLength(3);
  expect(result[0].rid).toBe('r1');
});

test('createJsonlAdapter filters, orders and limits', async () => {
  const result = await adapter.query({
    where: [['success', 'eq', false]],
    order: 'desc',
    limit: 1,
  });
  expect(result).toHaveLength(1);
  expect(result[0].rid).toBe('r2');
});

test('createJsonlAdapter applies the since and until window', async () => {
  const result = await adapter.query({
    since: '2026-09-01T10:00:01.000Z',
    until: '2026-09-01T10:00:01.500Z',
  });
  expect(result.map((row) => row.rid)).toEqual(['r1']);
  expect(result[0].event).toBe('request_failed');
});

test('createJsonlAdapter resolves nested and flattened field spellings alike', async () => {
  const nested = await adapter.query({ where: [['error.name', 'eq', 'RequestError']] });
  const flattened = await adapter.query({ where: [['error.name', 'eq', 'ServiceError']] });
  expect(nested.map((row) => row.rid)).toEqual(['r1']);
  expect(flattened.map((row) => row.rid)).toEqual(['r2']);
});

test('createJsonlAdapter aggregates counts by group, ordered by the first metric', async () => {
  const groups = await adapter.aggregate({
    where: [['success', 'eq', false]],
    group_by: ['config_key', 'error.name'],
    metrics: ['count'],
  });
  expect(groups).toEqual([
    { config_key: 'key-a', 'error.name': 'RequestError', count: 1 },
    { config_key: 'key-b', 'error.name': 'ServiceError', count: 1 },
  ]);
});

test('createJsonlAdapter computes a duration percentile per group', async () => {
  const groups = await adapter.aggregate({
    group_by: ['page_id'],
    metrics: ['p95:duration_ms', 'count'],
  });
  expect(groups).toEqual([
    { page_id: null, p95_duration_ms: 300, count: 1 },
    { page_id: 'orders', p95_duration_ms: 90, count: 2 },
  ]);
});

test('createJsonlAdapter rejects an unsupported operator', async () => {
  await expect(adapter.query({ where: [['event', 'like', 'x']] })).rejects.toThrow(
    'Ops query operator "like" is not supported.'
  );
});
