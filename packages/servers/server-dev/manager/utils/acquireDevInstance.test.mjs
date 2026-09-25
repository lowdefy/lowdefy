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

import acquireDevInstance from './acquireDevInstance.mjs';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dev-instance-')));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function instancePath() {
  return path.join(configDirectory, '.lowdefy', 'instance.json');
}

function readRecord() {
  return JSON.parse(fs.readFileSync(instancePath(), 'utf8'));
}

test('acquireDevInstance writes a starting record for this process, readable only by the owner', () => {
  const instance = acquireDevInstance({ configDirectory, owner: 'terminal', version: '6.0.0' });
  expect(instance.acquired).toBe(true);
  expect(readRecord()).toMatchObject({
    pid: process.pid,
    configDirectory,
    owner: 'terminal',
    state: 'starting',
    version: '6.0.0',
  });
  expect(fs.statSync(instancePath()).mode & 0o777).toBe(0o600);
});

test('acquireDevInstance update merges fields into the record', () => {
  const instance = acquireDevInstance({ configDirectory, owner: 'hub', version: '6.0.0' });
  instance.update({ port: 4100, internalPort: 4101 });
  instance.update({ state: 'ready' });
  expect(readRecord()).toMatchObject({
    owner: 'hub',
    port: 4100,
    internalPort: 4101,
    state: 'ready',
  });
});

test('acquireDevInstance release removes the record', () => {
  const instance = acquireDevInstance({ configDirectory, owner: 'terminal', version: '6.0.0' });
  instance.release();
  expect(fs.existsSync(instancePath())).toBe(false);
});

test('acquireDevInstance refuses when a live process holds this app', () => {
  // pid 1 (init/launchd) is always alive and never this process.
  fs.mkdirSync(path.dirname(instancePath()), { recursive: true });
  fs.writeFileSync(instancePath(), JSON.stringify({ pid: 1, configDirectory, port: 3000 }));
  const instance = acquireDevInstance({ configDirectory, owner: 'terminal', version: '6.0.0' });
  expect(instance.acquired).toBe(false);
  expect(instance.holder).toEqual({ pid: 1, configDirectory, port: 3000 });
});

test('acquireDevInstance takes over a record whose process has exited', () => {
  const dead = spawnSync('true').pid;
  fs.mkdirSync(path.dirname(instancePath()), { recursive: true });
  fs.writeFileSync(instancePath(), JSON.stringify({ pid: dead, configDirectory }));
  const instance = acquireDevInstance({ configDirectory, owner: 'terminal', version: '6.0.0' });
  expect(instance.acquired).toBe(true);
  expect(readRecord().pid).toBe(process.pid);
});

test('acquireDevInstance takes over a record copied from another checkout', () => {
  fs.mkdirSync(path.dirname(instancePath()), { recursive: true });
  fs.writeFileSync(instancePath(), JSON.stringify({ pid: 1, configDirectory: '/other/checkout' }));
  const instance = acquireDevInstance({ configDirectory, owner: 'terminal', version: '6.0.0' });
  expect(instance.acquired).toBe(true);
});

test('acquireDevInstance release leaves a record taken over by a newer manager', () => {
  const instance = acquireDevInstance({ configDirectory, owner: 'terminal', version: '6.0.0' });
  fs.writeFileSync(instancePath(), JSON.stringify({ pid: 1, configDirectory }));
  instance.release();
  expect(fs.existsSync(instancePath())).toBe(true);
});
