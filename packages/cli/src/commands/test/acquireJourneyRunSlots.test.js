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

import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import { acquireMachineSlot } from '@lowdefy/node-utils';

import acquireJourneyRunSlots from './acquireJourneyRunSlots.js';

let configDirectory;
let context;
let logs;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-slots-'));
  logs = [];
  context = {
    directories: { config: configDirectory },
    logger: { info: (line) => logs.push(line) },
  };
});

afterEach(() => {
  vi.useRealTimers();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function fakeAcquire() {
  const released = [];
  const acquire = vi.fn(async ({ name }) => ({ release: () => released.push(name) }));
  return { acquire, released };
}

function take(options = {}) {
  return acquireJourneyRunSlots({
    context,
    command: 'lowdefy test',
    readPressure: () => 'normal',
    env: {},
    ...options,
  });
}

test('acquireJourneyRunSlots takes the worktree slot first, then a machine slot', async () => {
  const { acquire } = fakeAcquire();
  await take({ acquire });
  const hash = crypto.createHash('sha1').update(fs.realpathSync(configDirectory)).digest('hex');
  expect(acquire.mock.calls.map(([options]) => [options.name, options.limit])).toEqual([
    [`journey-run-${hash.slice(0, 12)}`, 1],
    ['journey-run', 2],
  ]);
  expect(acquire.mock.calls[0][0]).toMatchObject({
    describe: { command: 'lowdefy test', configDirectory },
    onWaitIntervalMs: 30000,
    waitMs: 20 * 60 * 1000,
  });
});

test('acquireJourneyRunSlots allows one run at critical pressure, two otherwise, or the env count', async () => {
  const limits = async (options) => {
    const { acquire } = fakeAcquire();
    await take({ acquire, ...options });
    return acquire.mock.calls[1][0].limit;
  };
  expect(await limits({ readPressure: () => 'critical' })).toBe(1);
  expect(await limits({ readPressure: () => 'warn' })).toBe(2);
  expect(
    await limits({ readPressure: () => 'critical', env: { LOWDEFY_JOURNEY_RUN_SLOTS: '3' } })
  ).toBe(3);
  expect(await limits({ env: { LOWDEFY_JOURNEY_RUN_SLOTS: 'many' } })).toBe(2);
});

test('acquireJourneyRunSlots holds no machine slot while it waits on its worktree', async () => {
  let freeWorktree;
  const acquire = vi.fn(({ name }) =>
    name === 'journey-run'
      ? Promise.resolve({ release: () => {} })
      : new Promise((resolve) => {
          freeWorktree = () => resolve({ release: () => {} });
        })
  );
  const taking = take({ acquire });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(acquire).toHaveBeenCalledTimes(1);
  freeWorktree();
  await taking;
  expect(acquire).toHaveBeenCalledTimes(2);
});

test('acquireJourneyRunSlots shares one 20 minute budget across both waits', async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: 0 });
  const acquire = vi.fn(async ({ name }) => {
    if (name !== 'journey-run') {
      vi.setSystemTime(Date.now() + 5 * 60 * 1000);
    }
    return { release: () => {} };
  });
  await take({ acquire });
  expect(acquire.mock.calls.map(([options]) => options.waitMs)).toEqual([
    20 * 60 * 1000,
    15 * 60 * 1000,
  ]);
});

test('acquireJourneyRunSlots release frees both slots', async () => {
  const { acquire, released } = fakeAcquire();
  const slots = await take({ acquire });
  slots.release();
  expect(released.sort()).toEqual([acquire.mock.calls[0][0].name, 'journey-run'].sort());
});

test('acquireJourneyRunSlots frees the worktree slot when the machine wait runs out', async () => {
  const released = [];
  const timeout = Object.assign(new Error('busy'), { code: 'MACHINE_SLOT_TIMEOUT' });
  const acquire = vi.fn(async ({ name }) => {
    if (name === 'journey-run') {
      throw timeout;
    }
    return { release: () => released.push(name) };
  });
  await expect(take({ acquire })).rejects.toBe(timeout);
  expect(released).toEqual([acquire.mock.calls[0][0].name]);
});

test('acquireJourneyRunSlots says which runs hold the slots while it waits', async () => {
  const { acquire } = fakeAcquire();
  await take({ acquire });
  const { onWait } = acquire.mock.calls[1][0];
  onWait({
    waitedMs: 30000,
    holders: [
      {
        command: 'lowdefy test',
        configDirectory: path.join(process.cwd(), 'apps', 'foo'),
        pid: 123,
        acquiredAt: new Date(Date.now() - 4 * 60000).toISOString(),
      },
    ],
  });
  onWait({ waitedMs: 60000, holders: [] });
  expect(logs).toEqual([
    'Waiting for a journey run slot. Running now: lowdefy test in apps/foo (pid 123, 4 min).',
    'Waiting for a journey run slot.',
  ]);
});

test('acquireJourneyRunSlots at one slot waits for a run already holding slot 1 and leaves it alone', async () => {
  const originalHome = process.env.LOWDEFY_HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-slots-home-'));
  process.env.LOWDEFY_HOME = home;
  try {
    const slotDirectory = path.join(home, 'slots', 'journey-run');
    fs.mkdirSync(slotDirectory, { recursive: true });
    const other = { pid: process.pid, processStartTime: null, token: 'other-run' };
    fs.writeFileSync(path.join(slotDirectory, '1'), JSON.stringify(other));
    function acquireBriefly(options) {
      return acquireMachineSlot({ ...options, waitMs: 50, intervalMs: 10 });
    }
    await expect(
      take({ acquire: acquireBriefly, readPressure: () => 'critical' })
    ).rejects.toMatchObject({ code: 'MACHINE_SLOT_TIMEOUT', slot: 'journey-run' });
    expect(fs.readdirSync(slotDirectory)).toEqual(['1']);
    expect(JSON.parse(fs.readFileSync(path.join(slotDirectory, '1'), 'utf8'))).toEqual(other);
  } finally {
    if (originalHome === undefined) {
      delete process.env.LOWDEFY_HOME;
    } else {
      process.env.LOWDEFY_HOME = originalHome;
    }
    fs.rmSync(home, { recursive: true, force: true });
  }
});
