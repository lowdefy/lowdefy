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

// getBuildId reads build/buildStatus.json and build/invalidatePages from
// process.cwd(): point it at a throwaway server directory.
const serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-build-id-'));
fs.mkdirSync(path.join(serverDirectory, 'build'));
process.chdir(serverDirectory);

const { default: getBuildId } = await import('./getBuildId.js');

const statusPath = path.join(serverDirectory, 'build', 'buildStatus.json');
const invalidatePath = path.join(serverDirectory, 'build', 'invalidatePages');

afterEach(() => {
  fs.rmSync(statusPath, { force: true });
  fs.rmSync(invalidatePath, { force: true });
});

test('getBuildId is null before the first build', () => {
  expect(getBuildId()).toBeNull();
});

test('getBuildId is the config build time when no page was invalidated since', () => {
  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'ok', timestamp: '2026-03-01T10:00:00.000Z' })
  );
  fs.writeFileSync(invalidatePath, String(Date.parse('2026-03-01T09:00:00.000Z')));

  expect(getBuildId()).toBe('2026-03-01T10:00:00.000Z');
});

test('getBuildId moves on with a page invalidation after the config build', () => {
  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'ok', timestamp: '2026-03-01T10:00:00.000Z' })
  );
  fs.writeFileSync(invalidatePath, String(Date.parse('2026-03-01T10:05:00.000Z')));

  expect(getBuildId()).toBe('2026-03-01T10:05:00.000Z');
});

test('getBuildId does not move when a config build fails', () => {
  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'ok', timestamp: '2026-03-01T10:00:00.000Z' })
  );
  expect(getBuildId()).toBe('2026-03-01T10:00:00.000Z');

  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'error', timestamp: '2026-03-01T11:00:00.000Z', errors: [{}] })
  );
  expect(getBuildId()).toBe('2026-03-01T10:00:00.000Z');

  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'ok', timestamp: '2026-03-01T12:00:00.000Z' })
  );
  expect(getBuildId()).toBe('2026-03-01T12:00:00.000Z');
});

test('getBuildId keeps the last successful build when the status file is half written', () => {
  fs.writeFileSync(statusPath, '{"status":"ok","timest');
  expect(getBuildId()).toBe('2026-03-01T12:00:00.000Z');
});
