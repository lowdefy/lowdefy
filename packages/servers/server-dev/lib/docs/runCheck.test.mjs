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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

vi.doMock('child_process', () => ({
  execFile: vi.fn(),
}));

vi.doMock('@lowdefy/node-utils', () => ({
  readDevInstanceRecord: vi.fn(() => null),
}));

const { execFile } = await import('child_process');
const { readDevInstanceRecord } = await import('@lowdefy/node-utils');
const { default: runCheck } = await import('./runCheck.js');

const locatedError = {
  message: 'Page "nope" referenced in menu link "x" not found.',
  name: 'ConfigWarning',
  source: '/app/lowdefy.yaml:5',
  config: 'root.menus[0:default].links[0:x:MenuLink]',
  configKey: 'a',
  checkSlug: 'link-refs',
  prodError: true,
};

function mockChild({ stdout, error }) {
  execFile.mockImplementation((file, args, options, callback) => {
    if (error) {
      callback(error, { stdout: '', stderr: error.stderr ?? '' });
      return;
    }
    callback(null, { stdout, stderr: '' });
  });
}

// Holds each child until the test answers it, so calls can arrive mid-run.
function holdChildren() {
  const children = [];
  execFile.mockImplementation((file, args, options, callback) => {
    children.push((report) =>
      callback(null, { stdout: `${JSON.stringify(report)}\n`, stderr: '' })
    );
  });
  return children;
}

const originalConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;
let serverDirectory;

function writeBuildFile(name, content) {
  fs.writeFileSync(path.join(serverDirectory, 'build', name), content);
}

beforeEach(() => {
  process.env.LOWDEFY_DIRECTORY_CONFIG = '/app';
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'run-check-'));
  fs.mkdirSync(path.join(serverDirectory, 'build'));
  writeBuildFile('buildStatus.json', JSON.stringify({ status: 'success', timestamp: 1 }));
  vi.spyOn(process, 'cwd').mockReturnValue(serverDirectory);
  readDevInstanceRecord.mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(serverDirectory, { recursive: true, force: true });
  if (originalConfigDirectory === undefined) {
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  } else {
    process.env.LOWDEFY_DIRECTORY_CONFIG = originalConfigDirectory;
  }
});

test('runCheck runs the child in the server directory against the config directory', async () => {
  mockChild({ stdout: `${JSON.stringify({ errors: [], warnings: [] })}\n` });
  const result = await runCheck();
  expect(result).toEqual({ ok: true, errors: [], warnings: [] });
  const [file, args, options] = execFile.mock.calls[0];
  expect(file).toBe(process.execPath);
  expect(args[0]).toMatch(/runCheckChild\.js$/);
  expect(options.cwd).toBe(serverDirectory);
  expect(options.env.LOWDEFY_DIRECTORY_CONFIG).toBe('/app');
  expect(options.env.LOWDEFY_DIRECTORY_SERVER).toBe(serverDirectory);
});

test('runCheck returns the located errors and warnings with ok false when there are errors', async () => {
  const report = { errors: [locatedError], warnings: [{ ...locatedError, prodError: false }] };
  mockChild({ stdout: `some stray log line\n${JSON.stringify(report)}\n` });
  const result = await runCheck();
  expect(result).toEqual({ ok: false, ...report });
});

test('runCheck reports a broken check run as one unlocated internal error', async () => {
  const error = new Error('Command failed: node runCheckChild.js');
  error.stderr = 'TypeError: boom\n';
  mockChild({ error });
  const result = await runCheck();
  expect(result.ok).toBe(false);
  expect(result.warnings).toEqual([]);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].name).toBe('LowdefyInternalError');
  expect(result.errors[0].source).toBeNull();
  expect(result.errors[0].message).toBe(
    'lowdefy check failed to run: Command failed: node runCheckChild.js\nTypeError: boom'
  );
});

test('runCheck starts one child for two calls made at once on the same build', async () => {
  const children = holdChildren();
  const first = runCheck();
  const second = runCheck();
  expect(execFile).toHaveBeenCalledTimes(1);
  children[0]({ errors: [], warnings: [] });
  expect(await first).toEqual({ ok: true, errors: [], warnings: [] });
  expect(await second).toBe(await first);
});

test('runCheck starts its own child for a call made after a watched change during a run', async () => {
  const children = holdChildren();
  const first = runCheck();
  writeBuildFile('invalidatePages', '1000');
  const second = runCheck();
  expect(execFile).toHaveBeenCalledTimes(2);
  // A third call on the changed build joins the second run.
  const third = runCheck();
  expect(execFile).toHaveBeenCalledTimes(2);
  children[0]({ errors: [locatedError], warnings: [] });
  children[1]({ errors: [], warnings: [] });
  expect((await first).ok).toBe(false);
  expect((await second).ok).toBe(true);
  expect(await third).toBe(await second);
});

test('runCheck starts its own child for a call made while the manager handles an edit', async () => {
  const children = holdChildren();
  const first = runCheck();
  // An edit was seen: the batch is in progress, invalidatePages not yet written.
  readDevInstanceRecord.mockReturnValue({ building: true });
  const second = runCheck();
  expect(execFile).toHaveBeenCalledTimes(2);
  // A third call during the same batch joins the second run.
  const third = runCheck();
  expect(execFile).toHaveBeenCalledTimes(2);
  children[0]({ errors: [], warnings: [] });
  children[1]({ errors: [locatedError], warnings: [] });
  expect((await first).ok).toBe(true);
  expect((await second).ok).toBe(false);
  expect(await third).toBe(await second);
});

test('runCheck starts its own child for a call made after a config build during a run', async () => {
  const children = holdChildren();
  const first = runCheck();
  writeBuildFile('buildStatus.json', JSON.stringify({ status: 'success', timestamp: 2 }));
  const second = runCheck();
  expect(execFile).toHaveBeenCalledTimes(2);
  children[0]({ errors: [], warnings: [] });
  children[1]({ errors: [], warnings: [] });
  await Promise.all([first, second]);
});

test('runCheck keeps no report: a call after a run ends starts a new child', async () => {
  const children = holdChildren();
  const first = runCheck();
  children[0]({ errors: [], warnings: [] });
  await first;
  const second = runCheck();
  expect(execFile).toHaveBeenCalledTimes(2);
  children[1]({ errors: [locatedError], warnings: [] });
  expect((await second).ok).toBe(false);
});

test('runCheck starts a new child after a broken run ends', async () => {
  mockChild({ error: new Error('Command failed') });
  expect((await runCheck()).ok).toBe(false);
  mockChild({ stdout: `${JSON.stringify({ errors: [], warnings: [] })}\n` });
  expect((await runCheck()).ok).toBe(true);
  expect(execFile).toHaveBeenCalledTimes(2);
});
