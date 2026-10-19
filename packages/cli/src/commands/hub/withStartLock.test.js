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
import { wait } from '@lowdefy/helpers';

import withStartLock from './withStartLock.js';

let directory;
let lockPath;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-start-lock-'));
  lockPath = path.join(directory, 'start.lock');
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('withStartLock runs tasks one at a time', async () => {
  let running = 0;
  let mostAtOnce = 0;
  async function task() {
    running += 1;
    mostAtOnce = Math.max(mostAtOnce, running);
    await wait(30);
    running -= 1;
  }
  await Promise.all([1, 2, 3, 4].map(() => withStartLock({ lockPath }, task)));
  expect(mostAtOnce).toBe(1);
  expect(fs.existsSync(lockPath)).toBe(false);
});

test('withStartLock releases the lock when the task throws', async () => {
  await expect(
    withStartLock({ lockPath }, async () => {
      throw new Error('listen failed');
    })
  ).rejects.toThrow('listen failed');
  expect(fs.existsSync(lockPath)).toBe(false);
});

test('withStartLock takes over a lock left by a hub that died holding it', async () => {
  fs.mkdirSync(lockPath);
  const past = new Date(Date.now() - 60000);
  fs.utimesSync(lockPath, past, past);
  await expect(withStartLock({ lockPath }, async () => 'listening')).resolves.toBe('listening');
});
