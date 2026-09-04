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

process.env.LOWDEFY_LOG_LEVEL = 'silent';

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-trace-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
const writeArtifact = (name, data) =>
  fs.writeFileSync(path.join(fixtureDir, 'build', name), JSON.stringify(data));
writeArtifact('config.json', {});
writeArtifact('logger.json', {});
writeArtifact('appMeta.json', { gitSha: 'sha-build' });
writeArtifact('keyMap.json', {
  'key-step': { key: 'root.api[0:submit].routine[1]', '~r': 'ref-api', '~l': 7 },
});
writeArtifact('refMap.json', { 'ref-api': { parent: null, path: 'api/submit.yaml' } });
process.chdir(fixtureDir);
process.env.LOWDEFY_DIRECTORY_CONFIG = fixtureDir;

const events = [
  {
    time: '2026-09-01T09:00:02.000Z',
    event: 'step_failed',
    rid: 'rid-1',
    endpoint_id: 'submit',
    step_id: 'insert_order',
    config_key: 'key-step',
    git_sha: 'sha-build',
    success: false,
    duration_ms: 42,
    error: { name: 'RequestError', message: 'duplicate key', hint: 'unique index' },
  },
  {
    time: '2026-09-01T09:00:01.000Z',
    event: 'endpoint_completed',
    rid: 'rid-1',
    endpoint_id: 'submit',
    page_id: 'checkout',
    block_id: 'submit_button',
    git_sha: 'sha-build',
    success: true,
    duration_ms: 55,
  },
  { time: '2026-09-01T09:00:00.000Z', event: 'request_completed', rid: 'other', success: true },
  {
    time: '2026-09-01T08:59:00.000Z',
    event: 'journey_event',
    rid: 'rid-0',
    session_id: 'sess-1',
    page_id: 'checkout',
    block_id: 'submit_button',
    success: false,
  },
  {
    time: '2026-09-01T09:01:00.000Z',
    event: 'feedback_submitted',
    rid: 'rid-2',
    session_id: 'sess-1',
    page_id: 'checkout',
    text: 'Submitting the order does nothing.',
  },
];
const logPath = path.join(fixtureDir, 'events.jsonl');
fs.writeFileSync(logPath, events.map((event) => JSON.stringify(event)).join('\n'));

process.env.LOWDEFY_OPS_QUERY_URL = pathToFileURL(logPath).href;
process.env.LOWDEFY_OPS_READ_TOKEN = 'read-only';
process.env.LOWDEFY_OPS_DATASET = 'lowdefy-prod';

const { default: getProdTrace } = await import('./getProdTrace.js');
const { default: getProdRepro } = await import('./getProdRepro.js');
const { default: getProdSlow } = await import('./getProdSlow.js');

const ORIGIN = 'http://127.0.0.1:3000';

test('getProdTrace returns every event with the rid oldest first, each with its source', async () => {
  const result = await getProdTrace({ origin: ORIGIN, rid: 'rid-1' });
  expect(result.rid).toBe('rid-1');
  expect(result.note).toBeNull();
  expect(result.events.map((event) => event.event)).toEqual(['endpoint_completed', 'step_failed']);
  expect(result.events[1].source).toBe(path.join(fixtureDir, 'api/submit.yaml:7'));
  expect(result.events[1].error_hint).toBe('unique index');
});

test('getProdTrace names retention when no event carries the rid', async () => {
  const result = await getProdTrace({ origin: ORIGIN, rid: 'never-seen' });
  expect(result.events).toEqual([]);
  expect(result.note).toContain('30 days');
});

test('getProdTrace requires a rid or a session_id string', async () => {
  await expect(getProdTrace({ origin: ORIGIN, rid: '' })).rejects.toThrow(
    'lowdefy_prod_trace requires a "rid" or "session_id" string.'
  );
});

test('getProdTrace returns one browser session, journey steps and feedback report, oldest first', async () => {
  const result = await getProdTrace({ origin: ORIGIN, session_id: 'sess-1' });
  expect(result.session_id).toBe('sess-1');
  expect(result.rid).toBeNull();
  expect(result.note).toBeNull();
  expect(result.events.map((event) => event.event)).toEqual([
    'journey_event',
    'feedback_submitted',
  ]);
  expect(result.events[1].text).toBe('Submitting the order does nothing.');
});

test('getProdTrace names retention and sampling when no event carries the session_id', async () => {
  const result = await getProdTrace({ origin: ORIGIN, session_id: 'never-seen' });
  expect(result.events).toEqual([]);
  expect(result.note).toContain('sample_rate');
});

test('getProdRepro returns the events with the page and block ids when there is no journey to compile', async () => {
  const result = await getProdRepro({ origin: ORIGIN, rid: 'rid-1' });
  expect(result.journey).toBeNull();
  expect(result.note).toContain('nothing to compile');
  expect(result.page_ids).toEqual(['checkout']);
  expect(result.block_ids).toEqual(['submit_button']);
  expect(result.events).toHaveLength(2);
  expect(result.retention).toContain('30 days');
});

test('getProdSlow ranks by the requested duration percentile and resolves the source', async () => {
  const result = await getProdSlow({
    origin: ORIGIN,
    since: '2026-09-01T00:00:00.000Z',
    percentile: 95,
  });
  expect(result.percentile).toBe(95);
  expect(result.groups[0].p95_duration_ms).toBe(55);
  expect(result.groups[1].p95_duration_ms).toBe(42);
  expect(result.groups[1].source).toBe(path.join(fixtureDir, 'api/submit.yaml:7'));
});

test('getProdSlow restricts to one endpoint', async () => {
  const result = await getProdSlow({
    origin: ORIGIN,
    since: '2026-09-01T00:00:00.000Z',
    endpoint_id: 'submit',
    page_id: 'checkout',
  });
  expect(result.groups).toHaveLength(1);
  expect(result.groups[0].event).toBe('endpoint_completed');
});

test('getProdSlow rejects a percentile outside 0-100', async () => {
  await expect(getProdSlow({ origin: ORIGIN, percentile: 100 })).rejects.toThrow(
    'lowdefy_prod_slow percentile must be a number between 0 and 100.'
  );
});
