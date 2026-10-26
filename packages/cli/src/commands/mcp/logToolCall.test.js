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
import { afterEach, beforeEach, expect, test } from 'vitest';

import logToolCall, { LOG_FILE, MAX_LOG_BYTES } from './logToolCall.js';

let home;
let cwd;
const originalHome = process.env.LOWDEFY_HOME;

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-toolcalls-home-'));
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-toolcalls-cwd-'));
  process.env.LOWDEFY_HOME = home;
});

afterEach(() => {
  if (originalHome === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = originalHome;
  }
  fs.rmSync(home, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

const readLines = () =>
  fs
    .readFileSync(path.join(home, LOG_FILE), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));

test('logToolCall appends tool, app, ts, ms and ok, and nothing else', async () => {
  fs.mkdirSync(path.join(cwd, '.git'));
  fs.writeFileSync(path.join(cwd, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  await logToolCall({ name: 'lowdefy_build_status', cwd, startedAt: Date.now() - 5, ok: true });
  await logToolCall({ name: 'lowdefy_get_doc', cwd, startedAt: Date.now(), ok: false });
  const [first, second] = readLines();
  expect(Object.keys(first)).toEqual(['tool', 'app', 'ts', 'ms', 'ok']);
  expect(first.tool).toEqual('lowdefy_build_status');
  expect(first.app).toEqual(path.basename(fs.realpathSync.native(cwd)));
  expect(first.ms).toBeGreaterThanOrEqual(5);
  expect(Number.isNaN(Date.parse(first.ts))).toBe(false);
  expect(first.ok).toBe(true);
  expect(second.ok).toBe(false);
});

test('logToolCall records a null app when none can be resolved', async () => {
  await logToolCall({
    name: 'lowdefy_dev_list',
    cwd,
    directory: 'missing',
    startedAt: Date.now(),
    ok: true,
  });
  expect(readLines()[0].app).toBeNull();
});

test('logToolCall rolls the file over at 1 MB, keeping one old file', async () => {
  fs.writeFileSync(path.join(home, LOG_FILE), 'x'.repeat(MAX_LOG_BYTES));
  await logToolCall({ name: 'lowdefy_check', cwd, startedAt: Date.now(), ok: true });
  expect(fs.statSync(path.join(home, `${LOG_FILE}.1`)).size).toEqual(MAX_LOG_BYTES);
  expect(readLines()).toHaveLength(1);
});

test('logToolCall does not throw when the home cannot be written', async () => {
  const blocker = path.join(home, 'file');
  fs.writeFileSync(blocker, '');
  process.env.LOWDEFY_HOME = path.join(blocker, 'sub');
  await expect(
    logToolCall({ name: 'lowdefy_check', cwd, startedAt: Date.now(), ok: true })
  ).resolves.toBeUndefined();
});
