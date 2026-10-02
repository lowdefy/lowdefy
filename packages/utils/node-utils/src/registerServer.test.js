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
import { jest } from '@jest/globals';

const mockGetProcessStartTime = jest.fn();
jest.unstable_mockModule('./getProcessStartTime.js', () => ({
  default: mockGetProcessStartTime,
}));

const { default: registerServer } = await import('./registerServer.js');

let directory;
let exitListeners;

beforeEach(() => {
  directory = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-registry-')), 'servers');
  mockGetProcessStartTime.mockReset();
  mockGetProcessStartTime.mockImplementation(({ pid }) => `start-of-${pid}`);
  exitListeners = [];
  const on = process.on.bind(process);
  jest.spyOn(process, 'on').mockImplementation((event, listener) => {
    if (event === 'exit') {
      exitListeners.push(listener);
      return process;
    }
    return on(event, listener);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(path.dirname(directory), { recursive: true, force: true });
});

function readRecord() {
  return JSON.parse(fs.readFileSync(path.join(directory, `${process.pid}.json`), 'utf8'));
}

test('registerServer writes nothing and returns null without LOWDEFY_SERVER_REGISTRY_DIR', () => {
  const registration = registerServer({ kind: 'server', port: 3112, env: {} });
  expect(registration).toBe(null);
  expect(fs.existsSync(directory)).toBe(false);
  expect(exitListeners).toEqual([]);
});

test('registerServer writes a record naming the parent CLI as owner', () => {
  registerServer({
    kind: 'server',
    port: 3112,
    configDirectory: '/apps/one',
    env: { LOWDEFY_SERVER_REGISTRY_DIR: directory },
  });
  const record = readRecord();
  expect(record).toEqual({
    pid: process.pid,
    processStartTime: `start-of-${process.pid}`,
    kind: 'server',
    cwd: process.cwd(),
    configDirectory: '/apps/one',
    port: 3112,
    owner: { pid: process.ppid, processStartTime: `start-of-${process.ppid}`, via: 'cli' },
    startedAt: expect.any(String),
  });
  expect(fs.readdirSync(directory)).toEqual([`${process.pid}.json`]);
  if (process.platform !== 'win32') {
    expect(fs.statSync(path.join(directory, `${process.pid}.json`)).mode & 0o777).toBe(0o600);
  }
});

test('registerServer names the LOWDEFY_EXIT_WITH_PID process as owner when set', () => {
  registerServer({
    kind: 'dev',
    port: 3111,
    configDirectory: '/apps/one',
    env: { LOWDEFY_SERVER_REGISTRY_DIR: directory, LOWDEFY_EXIT_WITH_PID: '4242' },
  });
  expect(readRecord().owner).toEqual({
    pid: 4242,
    processStartTime: 'start-of-4242',
    via: 'exit-with-pid',
  });
  expect(readRecord().kind).toBe('dev');
});

test('registerServer update rewrites the record with the new fields', () => {
  const registration = registerServer({
    kind: 'dev',
    port: null,
    configDirectory: '/apps/one',
    env: { LOWDEFY_SERVER_REGISTRY_DIR: directory },
  });
  expect(readRecord().port).toBe(null);
  registration.update({ port: 3111 });
  expect(readRecord().port).toBe(3111);
  expect(readRecord().kind).toBe('dev');
  expect(fs.readdirSync(directory)).toEqual([`${process.pid}.json`]);
});

test('registerServer release removes the record and is registered on exit', () => {
  const registration = registerServer({
    kind: 'server',
    port: 3112,
    env: { LOWDEFY_SERVER_REGISTRY_DIR: directory },
  });
  expect(exitListeners).toEqual([registration.release]);
  registration.release();
  expect(fs.readdirSync(directory)).toEqual([]);
  registration.release();
});

test('registerServer release leaves a record that names another pid', () => {
  const registration = registerServer({
    kind: 'server',
    port: 3112,
    env: { LOWDEFY_SERVER_REGISTRY_DIR: directory },
  });
  const recordPath = path.join(directory, `${process.pid}.json`);
  fs.writeFileSync(recordPath, JSON.stringify({ pid: 99999 }));
  registration.release();
  expect(fs.existsSync(recordPath)).toBe(true);
});

test('registerServer warns and returns null when the directory cannot be written', () => {
  const blocker = path.join(path.dirname(directory), 'file');
  fs.writeFileSync(blocker, '');
  const logger = { warn: jest.fn() };
  const registration = registerServer({
    kind: 'server',
    port: 3112,
    env: { LOWDEFY_SERVER_REGISTRY_DIR: path.join(blocker, 'servers') },
    logger,
  });
  expect(registration).toBe(null);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(exitListeners).toEqual([]);
});
