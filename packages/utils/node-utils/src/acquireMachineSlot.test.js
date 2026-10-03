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

import { spawn } from 'child_process';
import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

import acquireMachineSlot from './acquireMachineSlot.js';

const originalHome = process.env.LOWDEFY_HOME;
let home;

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-slots-'));
  process.env.LOWDEFY_HOME = home;
});

afterEach(() => {
  if (originalHome === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = originalHome;
  }
  fs.rmSync(home, { recursive: true, force: true });
});

function slotPath(index) {
  return path.join(home, 'slots', 'browser', String(index));
}

function writeHolder(index, holder) {
  fs.mkdirSync(path.dirname(slotPath(index)), { recursive: true });
  fs.writeFileSync(slotPath(index), JSON.stringify(holder));
}

async function deadPid() {
  const child = spawn(process.execPath, ['-e', '']);
  await new Promise((resolve) => child.on('exit', resolve));
  return child.pid;
}

test('acquireMachineSlot hands out limit slots and a further caller waits for a release', async () => {
  const held = await Promise.all(
    [0, 1, 2].map(() => acquireMachineSlot({ name: 'browser', limit: 3 }))
  );
  expect(fs.readdirSync(path.join(home, 'slots', 'browser')).sort()).toEqual(['0', '1', '2']);

  let fourthTaken = false;
  const fourth = acquireMachineSlot({ name: 'browser', limit: 3, intervalMs: 20 }).then((slot) => {
    fourthTaken = true;
    return slot;
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(fourthTaken).toBe(false);

  held[1].release();
  const slot = await fourth;
  expect(JSON.parse(fs.readFileSync(slotPath(1), 'utf8'))).toMatchObject({ pid: process.pid });
  [held[0], held[2], slot].forEach((each) => each.release());
  expect(fs.readdirSync(path.join(home, 'slots', 'browser'))).toEqual([]);
});

test('acquireMachineSlot reclaims a slot whose process is gone', async () => {
  writeHolder(0, { pid: await deadPid(), processStartTime: null, token: 'gone' });
  const slot = await acquireMachineSlot({ name: 'browser', limit: 1, waitMs: 100 });
  expect(JSON.parse(fs.readFileSync(slotPath(0), 'utf8'))).toMatchObject({ pid: process.pid });
  slot.release();
});

test('acquireMachineSlot reclaims a slot whose pid now belongs to another process', async () => {
  writeHolder(0, {
    pid: process.pid,
    processStartTime: 'Thu Jan  1 00:00:00 1970',
    token: 'reused',
  });
  const slot = await acquireMachineSlot({ name: 'browser', limit: 1, waitMs: 100 });
  expect(JSON.parse(fs.readFileSync(slotPath(0), 'utf8')).token).not.toBe('reused');
  slot.release();
});

test('acquireMachineSlot gives up after waitMs, saying the slots stayed busy', async () => {
  const held = await acquireMachineSlot({ name: 'browser', limit: 1 });
  await expect(
    acquireMachineSlot({ name: 'browser', limit: 1, waitMs: 100, intervalMs: 20 })
  ).rejects.toThrow('All 1 browser slots on this machine stayed busy for 0.1 seconds. Try again.');
  held.release();
});

test('acquireMachineSlot states a wait of whole minutes in minutes', async () => {
  const held = await acquireMachineSlot({ name: 'browser', limit: 3 });
  await acquireMachineSlot({ name: 'browser', limit: 3 });
  await acquireMachineSlot({ name: 'browser', limit: 3 });
  // The clock jumps past the deadline after it is set.
  const start = Date.now();
  const now = jest
    .spyOn(Date, 'now')
    .mockReturnValueOnce(start)
    .mockReturnValue(start + 6 * 60000);
  try {
    await expect(acquireMachineSlot({ name: 'browser', limit: 3 })).rejects.toThrow(
      'All 3 browser slots on this machine stayed busy for 5 minutes. Try again.'
    );
  } finally {
    now.mockRestore();
    held.release();
  }
});

test('acquireMachineSlot release is harmless twice and never removes a slot another process owns', async () => {
  const slot = await acquireMachineSlot({ name: 'browser', limit: 1 });
  slot.release();
  slot.release();
  expect(fs.existsSync(slotPath(0))).toBe(false);

  const taken = await acquireMachineSlot({ name: 'browser', limit: 1 });
  writeHolder(0, { pid: 1, processStartTime: null, token: 'someone-else' });
  taken.release();
  expect(JSON.parse(fs.readFileSync(slotPath(0), 'utf8')).token).toBe('someone-else');
});
