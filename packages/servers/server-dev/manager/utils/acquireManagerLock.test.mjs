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
import { spawnSync } from 'child_process';

import acquireManagerLock from './acquireManagerLock.mjs';

let directory;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-lock-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('acquires a fresh lock, writes the pid, and release removes it', () => {
  const lock = acquireManagerLock({ directory });
  expect(lock.acquired).toBe(true);
  const written = JSON.parse(fs.readFileSync(lock.lockPath, 'utf8'));
  expect(written.pid).toBe(process.pid);
  lock.release();
  expect(fs.existsSync(lock.lockPath)).toBe(false);
});

test('refuses when another live process holds the lock', () => {
  // pid 1 (init/launchd) is always alive and never this process.
  fs.writeFileSync(
    path.join(directory, '.manager.lock'),
    JSON.stringify({ pid: 1, startedAt: '2026-08-31T08:07:00.000Z' })
  );
  const lock = acquireManagerLock({ directory });
  expect(lock.acquired).toBe(false);
  expect(lock.holder).toEqual({ pid: 1, startedAt: '2026-08-31T08:07:00.000Z' });
});

test('takes over a stale lock whose pid is dead', () => {
  const dead = spawnSync('true').pid;
  fs.writeFileSync(
    path.join(directory, '.manager.lock'),
    JSON.stringify({ pid: dead, startedAt: '2026-08-31T08:07:00.000Z' })
  );
  const lock = acquireManagerLock({ directory });
  expect(lock.acquired).toBe(true);
  expect(JSON.parse(fs.readFileSync(lock.lockPath, 'utf8')).pid).toBe(process.pid);
});

test('takes over an unreadable lock file', () => {
  fs.writeFileSync(path.join(directory, '.manager.lock'), 'not json');
  const lock = acquireManagerLock({ directory });
  expect(lock.acquired).toBe(true);
});

test('release leaves a lock that was taken over by a newer manager', () => {
  const lock = acquireManagerLock({ directory });
  fs.writeFileSync(
    lock.lockPath,
    JSON.stringify({ pid: 1, startedAt: '2026-08-31T09:00:00.000Z' })
  );
  lock.release();
  expect(fs.existsSync(lock.lockPath)).toBe(true);
});
