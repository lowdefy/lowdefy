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

// getStaleStatus reads build/buildStatus.json from process.cwd() — point it at
// a throwaway server directory before the module is imported.
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-stale-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'));
process.chdir(fixtureDir);

const statusPath = path.join(fixtureDir, 'build', 'buildStatus.json');

function writeStatus(status) {
  fs.writeFileSync(statusPath, JSON.stringify(status));
}

function removeStatus() {
  if (fs.existsSync(statusPath)) fs.rmSync(statusPath);
}

const { default: getStaleStatus } = await import('./getStaleStatus.js');

test('getStaleStatus returns null when buildStatus.json is missing', () => {
  removeStatus();
  expect(getStaleStatus()).toBe(null);
});

test('getStaleStatus returns null when the build status is ok', () => {
  writeStatus({ status: 'ok', timestamp: '2026-01-01T00:00:00.000Z', errors: [], warnings: [] });
  expect(getStaleStatus()).toBe(null);
});

test('getStaleStatus returns null when the build status is unknown', () => {
  writeStatus({ status: 'unknown' });
  expect(getStaleStatus()).toBe(null);
});

test('getStaleStatus returns the stale fields with the artifact timestamp when the build failed', () => {
  writeStatus({
    status: 'error',
    timestamp: '2026-02-03T04:05:06.000Z',
    errors: [{ message: 'Block type "Buton" not found.' }],
  });
  const status = getStaleStatus();
  expect(status.stale).toBe(true);
  expect(status.staleSince).toEqual('2026-02-03T04:05:06.000Z');
  expect(status.staleReason).toContain('The last build failed.');
  expect(status.staleReason).toContain('lowdefy_build_status');
});

test('getStaleStatus returns a null staleSince when the failed build has no timestamp', () => {
  writeStatus({ status: 'error', errors: [] });
  expect(getStaleStatus()).toEqual({
    stale: true,
    staleSince: null,
    staleReason: expect.any(String),
  });
});
