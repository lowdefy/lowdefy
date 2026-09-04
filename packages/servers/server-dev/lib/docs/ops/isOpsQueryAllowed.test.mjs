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

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-access-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
const writeArtifact = (name, data) =>
  fs.writeFileSync(path.join(fixtureDir, 'build', name), JSON.stringify(data));
writeArtifact('config.json', {});
writeArtifact('logger.json', {});
process.chdir(fixtureDir);

const { default: isOpsQueryAllowed } = await import('./isOpsQueryAllowed.js');

const LOOPBACK = 'http://localhost:3000';

function setCredentials() {
  process.env.LOWDEFY_OPS_QUERY_URL = 'https://api.axiom.co';
  process.env.LOWDEFY_OPS_READ_TOKEN = 'xaqt-read-only';
  process.env.LOWDEFY_OPS_DATASET = 'lowdefy-prod';
}

beforeEach(() => {
  delete process.env.LOWDEFY_OPS_QUERY_URL;
  delete process.env.LOWDEFY_OPS_READ_TOKEN;
  delete process.env.LOWDEFY_OPS_DATASET;
  delete process.env.LOWDEFY_SECRET_OTLP_TOKEN;
  writeArtifact('config.json', {});
  writeArtifact('logger.json', {});
});

test('isOpsQueryAllowed refuses and names every missing credential', () => {
  const result = isOpsQueryAllowed({ origin: LOOPBACK });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain('LOWDEFY_OPS_QUERY_URL');
  expect(result.reason).toContain('LOWDEFY_OPS_READ_TOKEN');
  expect(result.reason).toContain('LOWDEFY_OPS_DATASET');
  expect(result.howToEnable).toContain('read-only query credential');
});

test('isOpsQueryAllowed allows a loopback caller with all three credentials set', () => {
  setCredentials();
  expect(isOpsQueryAllowed({ origin: LOOPBACK })).toEqual({
    allowed: true,
    sink: {
      url: 'https://api.axiom.co',
      token: 'xaqt-read-only',
      dataset: 'lowdefy-prod',
    },
  });
});

test('isOpsQueryAllowed refuses when the read token is also a LOWDEFY_SECRET_ value', () => {
  setCredentials();
  process.env.LOWDEFY_SECRET_OTLP_TOKEN = 'xaqt-read-only';
  const result = isOpsQueryAllowed({ origin: LOOPBACK });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain('LOWDEFY_SECRET_OTLP_TOKEN');
  expect(result.reason).toContain('must never be the query token');
});

test('isOpsQueryAllowed refuses when the read token is an inline logger.otlp header value', () => {
  setCredentials();
  writeArtifact('logger.json', {
    otlp: { headers: { Authorization: 'xaqt-read-only' } },
  });
  const result = isOpsQueryAllowed({ origin: LOOPBACK });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain('logger.otlp.headers.Authorization');
});

test('isOpsQueryAllowed refuses a non-loopback host', () => {
  setCredentials();
  const result = isOpsQueryAllowed({ origin: 'https://calm-otter-42.ngrok.app' });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain('calm-otter-42.ngrok.app');
  expect(result.howToEnable).toContain('localhost');
});

test('isOpsQueryAllowed refuses a LAN bind reached on its interface address', () => {
  setCredentials();
  expect(isOpsQueryAllowed({ origin: 'http://192.168.1.20:3000' }).allowed).toBe(false);
});

test('isOpsQueryAllowed refuses when the transport reports no origin', () => {
  setCredentials();
  const result = isOpsQueryAllowed({ origin: undefined });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain('which host the caller reached');
});

test('isOpsQueryAllowed refuses when the app sets config.ops.enabled false', () => {
  setCredentials();
  writeArtifact('config.json', { ops: { enabled: false } });
  const result = isOpsQueryAllowed({ origin: LOOPBACK });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain('config.ops.enabled: false');
  expect(result.howToEnable).toContain('lowdefy.yaml');
});

test('isOpsQueryAllowed allows when config.ops.enabled is true', () => {
  setCredentials();
  writeArtifact('config.json', { ops: { enabled: true } });
  expect(isOpsQueryAllowed({ origin: LOOPBACK }).allowed).toBe(true);
});
