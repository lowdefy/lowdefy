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

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-repro-'));
fs.mkdirSync(path.join(fixtureDir, 'build', 'pages'), { recursive: true });
fs.mkdirSync(path.join(fixtureDir, 'build', 'plugins'), { recursive: true });
const writeArtifact = (name, data) =>
  fs.writeFileSync(path.join(fixtureDir, 'build', name), JSON.stringify(data));
writeArtifact('appMeta.json', { gitSha: 'sha-build' });
writeArtifact('keyMap.json', {});
writeArtifact('refMap.json', {});
writeArtifact('plugins/blockMetas.json', {
  Button: { category: 'button' },
  TextInput: { category: 'input', valueType: 'string' },
});
writeArtifact('pages/orders.json', {
  blockId: 'orders',
  type: 'Box',
  blocks: [
    { blockId: 'search', type: 'TextInput' },
    { blockId: 'submit', type: 'Button' },
  ],
});
process.chdir(fixtureDir);
process.env.LOWDEFY_DIRECTORY_CONFIG = fixtureDir;

const journeyEvent = (event) => ({
  event: 'journey_event',
  git_sha: 'sha-build',
  page_id: 'orders',
  page_instance: 'pi-1',
  rid: 'rid-1',
  session_id: 'sess-1',
  ...event,
});

const events = [
  { time: '2026-09-01T09:00:00.000Z', event: 'request_completed', rid: 'rid-1', success: true },
  journeyEvent({
    t: '2026-09-01T09:00:01.000Z',
    _time: '2026-09-01T09:00:01.000Z',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [{ id: 'a1', outcome: 'ok', type: 'Validate' }],
    state_writes: [{ path: 'search', type: 'string', value: 'shoes' }],
  }),
  journeyEvent({
    t: '2026-09-01T09:00:02.000Z',
    _time: '2026-09-01T09:00:02.000Z',
    block_id: 'submit',
    event_name: 'onClick',
    success: false,
    error_name: 'RequestError',
    config_key: 'key-submit',
    actions: [{ id: 'a2', outcome: 'error', type: 'Request' }],
  }),
  journeyEvent({
    t: '2026-09-01T09:00:03.000Z',
    _time: '2026-09-01T09:00:03.000Z',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [{ id: 'a3', outcome: 'ok', type: 'Validate' }],
    state_writes: [{ path: 'search', type: 'string', value: 'boots' }],
  }),
];
const logPath = path.join(fixtureDir, 'events.jsonl');
fs.writeFileSync(logPath, events.map((event) => JSON.stringify(event)).join('\n'));

process.env.LOWDEFY_OPS_QUERY_URL = pathToFileURL(logPath).href;
process.env.LOWDEFY_OPS_READ_TOKEN = 'read-only';
process.env.LOWDEFY_OPS_DATASET = 'lowdefy-prod';

const { default: getProdRepro } = await import('./getProdRepro.js');

const ORIGIN = 'http://127.0.0.1:3000';

test('getProdRepro compiles the events before the failure into a journey', async () => {
  const result = await getProdRepro({ origin: ORIGIN, rid: 'rid-1' });
  expect(result.journey).toEqual({
    name: 'orders recorded 5e9f5687',
    pageId: 'orders',
    steps: [
      { set: { blockId: 'search', value: 'shoes' } },
      { expect: { state: { equals: 'shoes', path: 'search' } } },
      { click: 'submit' },
    ],
  });
  expect(result.journey_yaml).toContain('- click: submit');
  expect(result.note).toContain('tests/journeys/');
});

test('getProdRepro stops the journey at the failure and reports it as the origin', async () => {
  const result = await getProdRepro({ origin: ORIGIN, rid: 'rid-1' });
  expect(result.journey_origin.failure).toEqual({
    block_id: 'submit',
    config_key: 'key-submit',
    error: 'RequestError',
    event_name: 'onClick',
    page_id: 'orders',
    rid: 'rid-1',
  });
});

test('getProdRepro still returns the raw events and the retention window', async () => {
  const result = await getProdRepro({ origin: ORIGIN, rid: 'rid-1' });
  expect(result.page_ids).toEqual(['orders']);
  expect(result.block_ids).toEqual(['search', 'submit']);
  expect(result.events).toHaveLength(4);
  expect(result.retention).toContain('30 days');
});

test('getProdRepro says there is nothing to compile when no journey event carries the rid', async () => {
  const result = await getProdRepro({ origin: ORIGIN, rid: 'never-seen' });
  expect(result.journey).toBeNull();
  expect(result.note).toContain('nothing to compile');
});

test('getProdRepro requires a rid string', async () => {
  await expect(getProdRepro({ origin: ORIGIN, rid: '' })).rejects.toThrow(
    'lowdefy_prod_repro requires a "rid" string.'
  );
});
