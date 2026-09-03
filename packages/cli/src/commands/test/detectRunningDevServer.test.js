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

import detectRunningDevServer from './detectRunningDevServer.js';

let devDirectory;

function writeLock(holder) {
  fs.writeFileSync(path.join(devDirectory, '.manager.lock'), JSON.stringify(holder));
}

beforeEach(() => {
  devDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-lock-'));
});

afterEach(() => {
  fs.rmSync(devDirectory, { recursive: true, force: true });
});

test('detectRunningDevServer reports no server when there is no lock file', () => {
  expect(detectRunningDevServer({ devDirectory })).toEqual({ running: false });
});

test('detectRunningDevServer reports no server for an unreadable lock file', () => {
  fs.writeFileSync(path.join(devDirectory, '.manager.lock'), 'not json');
  expect(detectRunningDevServer({ devDirectory })).toEqual({ running: false });
});

test('detectRunningDevServer reports no server for a stale lock whose pid is gone', () => {
  // Pid 1 is alive, so a pid that cannot exist is needed for a stale lock.
  writeLock({ pid: 2147483646, port: 3000 });
  expect(detectRunningDevServer({ devDirectory })).toEqual({ running: false });
});

test('detectRunningDevServer returns the url of the server holding the lock', () => {
  writeLock({ pid: process.pid, port: 3111 });
  expect(detectRunningDevServer({ devDirectory })).toEqual({
    running: true,
    pid: process.pid,
    url: 'http://localhost:3111',
  });
});

test('detectRunningDevServer reports a running server with no url when the lock records no port', () => {
  writeLock({ pid: process.pid });
  expect(detectRunningDevServer({ devDirectory })).toEqual({ running: true, pid: process.pid });
});
