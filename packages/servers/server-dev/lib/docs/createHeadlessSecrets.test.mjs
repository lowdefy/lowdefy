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

import { afterEach, beforeEach, expect, test } from 'vitest';

import createHeadlessSecrets from './createHeadlessSecrets.js';

let buildDirectory;

function writeArtifact(filePath, value) {
  const fullPath = path.join(buildDirectory, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(value));
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-headless-secrets-'));
  // The app's real secrets, as a shell, CI job or infisical run puts them in the dev server's env.
  process.env.LOWDEFY_SECRET_WEBHOOK_SECRET = 'real-webhook-secret';
  process.env.LOWDEFY_SECRET_ORG_ID = 'org_real';
  writeArtifact('api/endpoints/events.json', {
    verify: { secret: { _secret: 'WEBHOOK_SECRET' } },
    routine: [{ properties: { org: { _secret: 'ORG_ID' } } }],
  });
});

afterEach(() => {
  delete process.env.LOWDEFY_SECRET_WEBHOOK_SECRET;
  delete process.env.LOWDEFY_SECRET_ORG_ID;
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('createHeadlessSecrets gives every secret the build names its stand-in, never the real value', () => {
  const { secrets, scrubSecrets } = createHeadlessSecrets({ buildDirectory });
  expect(secrets).toEqual({
    ORG_ID: 'test-secret-ORG_ID',
    WEBHOOK_SECRET: 'test-secret-WEBHOOK_SECRET',
  });
  // The scrub redacts the stand-ins, and leaves a value that only matches a real secret alone: a
  // data set id equal to a real secret reads as written.
  expect(scrubSecrets('org_real/test-secret-ORG_ID')).toEqual('org_real/[REDACTED]');
});

test("createHeadlessSecrets lays the run's test values over the stand-ins", () => {
  const { secrets } = createHeadlessSecrets({
    buildDirectory,
    secrets: { ORG_ID: 'org_test' },
  });
  expect(secrets).toEqual({ ORG_ID: 'org_test', WEBHOOK_SECRET: 'test-secret-WEBHOOK_SECRET' });
});

test('createHeadlessSecrets names a secret of a page built since it last read the build', () => {
  expect(Object.keys(createHeadlessSecrets({ buildDirectory }).secrets)).toEqual([
    'ORG_ID',
    'WEBHOOK_SECRET',
  ]);
  writeArtifact('pages/later/requests/send.json', { properties: { key: { _secret: 'MAIL_KEY' } } });
  expect(createHeadlessSecrets({ buildDirectory }).secrets.MAIL_KEY).toEqual(
    'test-secret-MAIL_KEY'
  );
});
