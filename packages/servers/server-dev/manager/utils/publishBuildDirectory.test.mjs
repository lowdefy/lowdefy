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

import publishBuildDirectory from './publishBuildDirectory.mjs';

let root;
let buildDirectory;
let stagingDirectory;

function write(directory, file, content) {
  const filePath = path.join(directory, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function read(file) {
  return fs.readFileSync(path.join(buildDirectory, file), 'utf8');
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-publish-build-'));
  buildDirectory = path.join(root, 'build');
  stagingDirectory = path.join(root, 'build-staging');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('publishBuildDirectory replaces live files with the staged build', async () => {
  write(buildDirectory, 'app.json', 'old');
  write(buildDirectory, 'connections/db.json', 'old');
  write(stagingDirectory, 'app.json', 'new');
  write(stagingDirectory, 'connections/db.json', 'new');
  write(stagingDirectory, 'api/endpoint.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('app.json')).toBe('new');
  expect(read('connections/db.json')).toBe('new');
  expect(read('api/endpoint.json')).toBe('new');
});

test('publishBuildDirectory removes live files the new build did not write', async () => {
  write(buildDirectory, 'app.json', 'old');
  write(buildDirectory, 'connections/removed.json', 'old');
  write(buildDirectory, 'pages/jit-page.json', 'old');
  write(stagingDirectory, 'app.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(fs.existsSync(path.join(buildDirectory, 'connections/removed.json'))).toBe(false);
  expect(fs.existsSync(path.join(buildDirectory, 'pages/jit-page.json'))).toBe(false);
  expect(read('app.json')).toBe('new');
});

test('publishBuildDirectory removes the staging directory', async () => {
  write(stagingDirectory, 'app.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(fs.existsSync(stagingDirectory)).toBe(false);
});

test('publishBuildDirectory creates the live directory on the first build', async () => {
  write(stagingDirectory, 'app.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('app.json')).toBe('new');
});

test('an artifact present in both builds exists at every point of the publish', async () => {
  write(buildDirectory, 'connections/db.json', 'old');
  write(stagingDirectory, 'connections/db.json', 'new');
  for (let i = 0; i < 200; i++) {
    write(buildDirectory, `api/endpoint-${i}.json`, 'old');
    write(stagingDirectory, `api/endpoint-${i}.json`, 'new');
  }

  let checks = 0;
  let missing = 0;
  let publishing = true;
  const check = () => {
    checks += 1;
    if (!fs.existsSync(path.join(buildDirectory, 'connections/db.json'))) {
      missing += 1;
    }
    if (publishing) {
      setImmediate(check);
    }
  };
  setImmediate(check);
  await publishBuildDirectory({ buildDirectory, stagingDirectory });
  publishing = false;

  expect(checks).toBeGreaterThan(1);
  expect(missing).toBe(0);
  expect(read('connections/db.json')).toBe('new');
});
