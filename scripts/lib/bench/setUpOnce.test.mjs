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

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import setUpOnce, { READY_MARKER } from './setUpOnce.mjs';

const sha = 'a'.repeat(40);

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'set-up-once-'));
  const directory = path.join(root, 'lowdefy-bench-aaaaaaa');
  const messages = [];
  const logger = {
    info: (message) => messages.push(message),
    warn: (message) => messages.push(message),
  };
  const calls = [];
  const create = async () => {
    calls.push(Date.now());
    await sleep(100);
    fs.mkdirSync(directory, { recursive: true });
  };
  return { calls, create, directory, logger, messages, root };
}

test('setUpOnce builds once for two concurrent callers, and the other waits and reuses', async () => {
  const { calls, create, directory, logger, messages, root } = setup();
  const results = await Promise.all([
    setUpOnce({ create, directory, logger, pollMs: 10, sha }),
    setUpOnce({ create, directory, logger, pollMs: 10, sha }),
  ]);
  assert.equal(calls.length, 1);
  assert.deepEqual(results.map(({ reused }) => reused).sort(), [false, true]);
  assert.equal(fs.readFileSync(path.join(directory, READY_MARKER), 'utf8'), `${sha}\n`);
  assert.ok(
    messages.includes(`Waiting for process ${process.pid} to finish setting up ${directory}.`)
  );
  assert.equal(fs.existsSync(`${directory}.lock`), false);
  assert.deepEqual(
    fs.readdirSync(root).filter((name) => name.includes('.lock')),
    []
  );
  fs.rmSync(root, { recursive: true });
});

test('setUpOnce reuses a ready folder without creating it', async () => {
  const { calls, create, directory, logger, root } = setup();
  fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, READY_MARKER), `${sha}\n`);
  assert.deepEqual(await setUpOnce({ create, directory, logger, sha }), { reused: true });
  assert.equal(calls.length, 0);
  fs.rmSync(root, { recursive: true });
});

test('setUpOnce sets up again a folder left without its ready marker', async () => {
  const { calls, create, directory, logger, root } = setup();
  fs.mkdirSync(directory);
  assert.deepEqual(await setUpOnce({ create, directory, logger, sha }), { reused: false });
  assert.equal(calls.length, 1);
  fs.rmSync(root, { recursive: true });
});

test('setUpOnce takes over a lock whose holder is no longer running', async () => {
  const { calls, create, directory, logger, messages, root } = setup();
  const deadPid = spawnSync(process.execPath, ['-e', '']).pid;
  fs.mkdirSync(`${directory}.lock`);
  fs.writeFileSync(path.join(`${directory}.lock`, 'pid'), String(deadPid));
  assert.deepEqual(await setUpOnce({ create, directory, logger, pollMs: 10, sha }), {
    reused: false,
  });
  assert.equal(calls.length, 1);
  assert.ok(messages.some((message) => message.includes(`lock of process ${deadPid}`)));
  assert.deepEqual(
    fs.readdirSync(root).filter((name) => name.includes('.lock')),
    []
  );
  fs.rmSync(root, { recursive: true });
});

test('setUpOnce frees the lock when creating fails, so the next caller can try again', async () => {
  const { directory, logger, root } = setup();
  await assert.rejects(
    setUpOnce({
      create: async () => {
        throw new Error('install failed');
      },
      directory,
      logger,
      sha,
    }),
    /install failed/
  );
  assert.equal(fs.existsSync(`${directory}.lock`), false);
  assert.equal(fs.existsSync(path.join(directory, READY_MARKER)), false);
  fs.rmSync(root, { recursive: true });
});
