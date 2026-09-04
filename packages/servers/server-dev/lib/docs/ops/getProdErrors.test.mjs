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

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-errors-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
const writeArtifact = (name, data) =>
  fs.writeFileSync(path.join(fixtureDir, 'build', name), JSON.stringify(data));
writeArtifact('config.json', {});
writeArtifact('logger.json', {});
writeArtifact('appMeta.json', { gitSha: 'sha-build' });
writeArtifact('keyMap.json', {
  'key-a': { key: 'root.pages[0:orders].requests[0:get_orders]', '~r': 'ref-orders', '~l': 12 },
});
writeArtifact('refMap.json', { 'ref-orders': { parent: null, path: 'pages/orders.yaml' } });
process.chdir(fixtureDir);
process.env.LOWDEFY_DIRECTORY_CONFIG = fixtureDir;

const events = [
  { time: '2026-08-30T09:00:00.000Z', event: 'process_started', git_sha: 'sha-old' },
  {
    time: '2026-08-30T09:05:00.000Z',
    event: 'request_failed',
    rid: 'old-rid',
    success: false,
    config_key: 'key-a',
    git_sha: 'sha-old',
    error: { name: 'RequestError', message: 'before the deploy' },
  },
  { time: '2026-09-01T09:00:00.000Z', event: 'process_started', git_sha: 'sha-build' },
  {
    time: '2026-09-01T09:10:00.000Z',
    event: 'request_failed',
    rid: 'rid-1',
    page_id: 'orders',
    block_id: 'orders_table',
    request_id: 'get_orders',
    success: false,
    config_key: 'key-a',
    git_sha: 'sha-build',
    error: { name: 'RequestError', message: 'connection refused', hint: 'check the connection' },
  },
  {
    time: '2026-09-01T09:11:00.000Z',
    event: 'request_failed',
    rid: 'rid-2',
    page_id: 'orders',
    success: false,
    config_key: 'key-a',
    git_sha: 'sha-build',
    error: { name: 'RequestError', message: 'connection refused' },
  },
  {
    time: '2026-09-01T09:12:00.000Z',
    event: 'endpoint_failed',
    rid: 'rid-3',
    endpoint_id: 'submit',
    success: false,
    config_key: 'key-unbuilt',
    git_sha: 'sha-deployed',
    error: { name: 'ServiceError', message: 'upstream 502' },
  },
  { time: '2026-09-01T09:13:00.000Z', event: 'request_completed', rid: 'rid-4', success: true },
];

const logPath = path.join(fixtureDir, 'events.jsonl');
fs.writeFileSync(logPath, events.map((event) => JSON.stringify(event)).join('\n'));

const { default: getProdErrors } = await import('./getProdErrors.js');
const { default: devNoticeStore } = await import('../devNoticeStore.js');

function setCredentials() {
  process.env.LOWDEFY_OPS_QUERY_URL = pathToFileURL(logPath).href;
  process.env.LOWDEFY_OPS_READ_TOKEN = 'read-only';
  process.env.LOWDEFY_OPS_DATASET = 'lowdefy-prod';
}

beforeEach(() => {
  delete process.env.LOWDEFY_OPS_QUERY_URL;
  delete process.env.LOWDEFY_OPS_READ_TOKEN;
  delete process.env.LOWDEFY_OPS_DATASET;
  writeArtifact('config.json', {});
});

test('getProdErrors groups failures since the deploy by source, resolving config_key to a file', async () => {
  setCredentials();
  const result = await getProdErrors({ origin: 'http://localhost:3000' });
  expect(result.since).toBe('2026-09-01T09:00:00.000Z');
  expect(result.git_sha).toBe('sha-build');
  expect(result.group_by).toBe('source');
  expect(result.groups).toEqual([
    {
      // group_by "source" resolves through this build's keyMap, so the group
      // key is the file:line an agent hands to lowdefy_find_config.
      source: path.join(fixtureDir, 'pages/orders.yaml:12'),
      count: 2,
      error_name: 'RequestError',
      error_message: 'connection refused',
      error_hint: null,
      // The newest matching row is the sample, so the hint-less rid-2 wins.
      config: 'root.pages[0:orders].requests[0:get_orders]',
      config_key: 'key-a',
      sample_rid: 'rid-2',
      page_id: 'orders',
      block_id: null,
      request_id: null,
      endpoint_id: null,
      step_id: null,
    },
    {
      source: null,
      count: 1,
      error_name: 'ServiceError',
      error_message: 'upstream 502',
      error_hint: null,
      config_key: 'key-unbuilt',
      note: expect.stringContaining('sha-deployed'),
      sample_rid: 'rid-3',
      page_id: null,
      block_id: null,
      request_id: null,
      endpoint_id: 'submit',
      step_id: null,
    },
  ]);
  expect(result.groups[0].source).not.toBeNull();
});

test('getProdErrors resolves an explicit ISO since and includes older deploys', async () => {
  setCredentials();
  const result = await getProdErrors({
    origin: 'http://localhost:3000',
    since: '2026-08-01T00:00:00.000Z',
  });
  expect(result.since).toBe('2026-08-01T00:00:00.000Z');
  expect(result.git_sha).toBeNull();
  expect(result.groups.map((group) => group.count)).toEqual([3, 1]);
});

test('getProdErrors groups by page and by endpoint', async () => {
  setCredentials();
  const byPage = await getProdErrors({ origin: 'http://localhost:3000', group_by: 'page' });
  expect(byPage.groups[0].page).toBe('orders');
  const byEndpoint = await getProdErrors({ origin: 'http://localhost:3000', group_by: 'endpoint' });
  expect(byEndpoint.groups.map((group) => group.endpoint)).toContain('submit');
});

test('getProdErrors rejects an unknown group_by', async () => {
  setCredentials();
  await expect(
    getProdErrors({ origin: 'http://localhost:3000', group_by: 'tenant' })
  ).rejects.toThrow('lowdefy_prod_errors group_by must be one of source, org, page, endpoint.');
});

test('getProdErrors refuses on a non-loopback origin and does not read the sink', async () => {
  setCredentials();
  const result = await getProdErrors({ origin: 'https://tunnel.example.com' });
  expect(result).toEqual({
    refused: true,
    reason: expect.stringContaining('tunnel.example.com'),
    howToEnable: expect.stringContaining('localhost'),
  });
});

test('getProdErrors refuses when the app sets config.ops.enabled false', async () => {
  setCredentials();
  writeArtifact('config.json', { ops: { enabled: false } });
  const result = await getProdErrors({ origin: 'http://localhost:3000' });
  expect(result.refused).toBe(true);
  expect(result.reason).toContain('config.ops.enabled: false');
});

test('every ops query leaves an audit notice, whether it ran or was refused', async () => {
  setCredentials();
  await getProdErrors({ origin: 'http://localhost:3000', group_by: 'page' });
  await getProdErrors({ origin: 'https://tunnel.example.com' });
  const notices = devNoticeStore.list().filter((notice) => notice.name === 'ops_query');
  const ran = notices.at(-2);
  const refused = notices.at(-1);
  expect(ran.level).toBe('info');
  expect(ran.message).toContain('lowdefy_prod_errors read the production log sink');
  expect(ran.details).toEqual({
    tool: 'lowdefy_prod_errors',
    params: { since: 'deploy', group_by: 'page', limit: 20 },
    allowed: true,
  });
  expect(refused.level).toBe('warn');
  expect(refused.message).toContain('was refused');
  expect(refused.details.allowed).toBe(false);
});
