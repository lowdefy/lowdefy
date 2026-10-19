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

import createServerArtifactTracker from './createServerArtifactTracker.mjs';

let server;

function write(file, content) {
  fs.mkdirSync(path.dirname(path.join(server, file)), { recursive: true });
  fs.writeFileSync(path.join(server, file), content);
}

beforeEach(() => {
  server = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-artifacts-'));
  write('package.json', '{"dependencies":{}}');
  write('build/config.json', '{"~k":"a","theme":{}}');
  write('build/plugins/connections.js', 'export default {};');
});

afterEach(() => {
  fs.rmSync(server, { recursive: true, force: true });
});

test.each([
  ['nothing changed', () => {}, { install: false, restart: false }],
  [
    'only build keys changed',
    () => write('build/config.json', '{"~k":"b","theme":{}}'),
    { install: false, restart: false },
  ],
  [
    'a new connection type',
    () => write('build/plugins/connections.js', 'export { A };'),
    { install: false, restart: true },
  ],
  [
    'a server artifact appeared',
    () => write('build/auth.json', '{}'),
    { install: false, restart: true },
  ],
  [
    'a new plugin package',
    () => write('package.json', '{"dependencies":{"a":"1"}}'),
    { install: true, restart: true },
  ],
])('the server artifact tracker reports %s', (_, change, expected) => {
  const tracker = createServerArtifactTracker({ directories: { server } });
  tracker.record();
  change();

  expect(tracker.check()).toEqual(expected);
});

test('the server artifact tracker compares with what the server last started with', () => {
  const tracker = createServerArtifactTracker({ directories: { server } });
  write('build/plugins/connections.js', 'export { A };');
  expect(tracker.check().restart).toBe(true);

  tracker.record();
  expect(tracker.check().restart).toBe(false);
});
