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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import readTestAppSecretNames from './readTestAppSecretNames.js';

let server;
let testApp;

function writeBuild(name, value) {
  const filePath = path.join(server, 'build', name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

function keptPath() {
  return path.join(server, '.lowdefy', 'test', 'secretNames.json');
}

beforeEach(() => {
  server = fs.mkdtempSync(path.join(os.tmpdir(), 'test-secret-names-'));
  writeBuild('connections/db.json', { properties: { uri: { _secret: 'MONGODB_URI' } } });
  testApp = {
    appMeta: { buildId: 'build-1' },
    directories: { build: path.join(server, 'build'), config: server, server },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(server, { recursive: true, force: true });
});

test('readTestAppSecretNames scans the build and keeps the names by build id', async () => {
  expect(await readTestAppSecretNames({ testApp })).toEqual(['MONGODB_URI']);
  expect(JSON.parse(fs.readFileSync(keptPath(), 'utf8'))).toEqual({
    buildId: 'build-1',
    names: ['MONGODB_URI'],
  });
});

test('readTestAppSecretNames reads the kept names for the same build without scanning it', async () => {
  await readTestAppSecretNames({ testApp });
  const readdirSync = vi.spyOn(fs, 'readdirSync');
  expect(await readTestAppSecretNames({ testApp })).toEqual(['MONGODB_URI']);
  expect(readdirSync).not.toHaveBeenCalled();
});

test('readTestAppSecretNames scans a rebuilt server again', async () => {
  await readTestAppSecretNames({ testApp });
  writeBuild('api/send.json', { routine: [{ properties: { key: { _secret: 'MAIL_KEY' } } }] });
  testApp.appMeta = { buildId: 'build-2' };
  expect(await readTestAppSecretNames({ testApp })).toEqual(['MAIL_KEY', 'MONGODB_URI']);
});

test('readTestAppSecretNames scans the build when the kept file is not readable JSON', async () => {
  fs.mkdirSync(path.dirname(keptPath()), { recursive: true });
  fs.writeFileSync(keptPath(), '{"buildId": "build-1", "na');
  expect(await readTestAppSecretNames({ testApp })).toEqual(['MONGODB_URI']);
});

test('readTestAppSecretNames scans a build with no build id and keeps nothing', async () => {
  testApp.appMeta = {};
  expect(await readTestAppSecretNames({ testApp })).toEqual(['MONGODB_URI']);
  expect(fs.existsSync(keptPath())).toBe(false);
});

test('readTestAppSecretNames still answers when the folder for the kept names cannot be written', async () => {
  // A file where the .lowdefy folder would go makes the write fail.
  fs.writeFileSync(path.join(server, '.lowdefy'), '');
  expect(await readTestAppSecretNames({ testApp })).toEqual(['MONGODB_URI']);
});
