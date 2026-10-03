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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../lib/docs/getBuildId.js', () => ({
  default: () => '2026-10-03T14:02:00.000Z',
}));

const { default: devRecordingHandler } = await import('./devRecording.js');
const { default: localDevToolsOnly } = await import('../middleware/localDevToolsOnly.js');
const { JOURNEY_COOKIES, writeJourneyCookie } = await import('../../lib/server/journeyCookies.js');
const { default: recordingCookiePayload } = await import(
  '../../lib/server/recording/recordingCookiePayload.js'
);

const SESSION = '20261003T140311Z-k3x9qa';
const RUN_ID = '20261003T151200Z-p0d4rm';
const origin = 'http://localhost:3001';
let configDirectory;

function createApp() {
  const app = new Hono();
  app.use('/api/dev-recording', localDevToolsOnly());
  app.post('/api/dev-recording', bodyLimit({ maxSize: 1024 * 1024 }), devRecordingHandler);
  return app;
}

function record(extra = {}) {
  return {
    v: 1,
    session: SESSION,
    t: '2026-10-03T14:03:12.000Z',
    kind: 'click',
    scope: 'page',
    page_id: 'tickets',
    event: null,
    ...extra,
  };
}

function cookieFor(payload) {
  const cookie = writeJourneyCookie({ name: JOURNEY_COOKIES.recording.name, payload, origin });
  return `${cookie.name}=${cookie.value}`;
}

function post({ body, headers = {} }) {
  return createApp().request('/api/dev-recording', {
    method: 'POST',
    headers: {
      host: 'localhost:3001',
      origin,
      'content-type': 'application/json',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function readLines(...segments) {
  const filePath = path.join(configDirectory, '.lowdefy', 'traces', ...segments);
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line));
}

function tracesExist() {
  return fs.existsSync(path.join(configDirectory, '.lowdefy', 'traces'));
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-recording-'));
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
  delete process.env.LOWDEFY_DEV_RECORD;
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  delete process.env.LOWDEFY_DEV_RECORD;
});

test('POST /api/dev-recording refuses a cross-site request', async () => {
  const res = await post({
    body: { session: SESSION, records: [record()] },
    headers: { origin: 'https://evil.example' },
  });
  expect(res.status).toBe(403);
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording refuses a request with no Origin', async () => {
  const res = await createApp().request('/api/dev-recording', {
    method: 'POST',
    headers: { host: 'localhost:3001', 'content-type': 'application/json' },
    body: JSON.stringify({ session: SESSION, records: [record()] }),
  });
  expect(res.status).toBe(403);
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording answers 400 for a session id that is not a trace id', async () => {
  for (const session of ['../x', '', `${SESSION}/../../x`]) {
    const res = await post({ body: { session, records: [record()] } });
    expect(res.status).toBe(400);
  }
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording answers 400 for more than 500 records or non-object records', async () => {
  const many = Array.from({ length: 501 }, () => record());
  expect((await post({ body: { session: SESSION, records: many } })).status).toBe(400);
  expect((await post({ body: { session: SESSION, records: ['x'] } })).status).toBe(400);
  expect((await post({ body: 'not json' })).status).toBe(400);
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording refuses a body over 1 MiB', async () => {
  const big = 'x'.repeat(1024 * 1024 + 1);
  const res = await post({ body: { session: SESSION, records: [record({ big })] } });
  expect(res.status).toBe(413);
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording writes nothing when LOWDEFY_DEV_RECORD is false', async () => {
  process.env.LOWDEFY_DEV_RECORD = 'false';
  const res = await post({ body: { session: SESSION, records: [record()] } });
  expect(res.status).toBe(204);
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording writes nothing when the recording cookie is off', async () => {
  const res = await post({
    body: { session: SESSION, records: [record()] },
    headers: { cookie: cookieFor('off') },
  });
  expect(res.status).toBe(204);
  expect(tracesExist()).toBe(false);
});

test('POST /api/dev-recording appends lines to the dev session file, stamped with build and source', async () => {
  await post({ body: { session: SESSION, records: [record(), record({ kind: 'change' })] } });
  const res = await post({
    body: { session: SESSION, records: [record({ source: 'journey', run: { id: RUN_ID } })] },
  });
  expect(res.status).toBe(204);
  const lines = readLines('dev', '2026-10-03', `${SESSION}.jsonl`);
  expect(lines).toHaveLength(3);
  lines.forEach((line) => {
    expect(line.build).toBe('2026-10-03T14:02:00.000Z');
    expect(line.source).toBe('dev');
    expect(line).not.toHaveProperty('run');
  });
  expect(lines[1].kind).toBe('change');
});

test('POST /api/dev-recording writes a journey cookie run to its run file, overriding a client source', async () => {
  const run = {
    id: RUN_ID,
    by: 'test',
    journey: 'tests/journeys/tickets.yaml#Assign a ticket',
    actor: 'main',
  };
  const res = await post({
    body: { session: SESSION, records: [record({ source: 'dev' })] },
    headers: {
      cookie: cookieFor(recordingCookiePayload({ recording: { source: 'journey', run } })),
    },
  });
  expect(res.status).toBe(204);
  const [line] = readLines('journey', '2026-10-03', `${RUN_ID}.jsonl`);
  expect(line).toMatchObject({ source: 'journey', run, session: SESSION });
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'traces', 'dev'))).toBe(false);
});

test('POST /api/dev-recording records a forged recording cookie as dev', async () => {
  const payload = recordingCookiePayload({
    recording: { source: 'journey', run: { id: RUN_ID, by: 'test' } },
  });
  const res = await post({
    body: { session: SESSION, records: [record()] },
    headers: { cookie: `lowdefy_recording=forged-token.${payload}` },
  });
  expect(res.status).toBe(204);
  const [line] = readLines('dev', '2026-10-03', `${SESSION}.jsonl`);
  expect(line.source).toBe('dev');
});
