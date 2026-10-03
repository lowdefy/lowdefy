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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { jest } from '@jest/globals';

import withBrowserSlot from './withBrowserSlot.js';

function fakeAcquire() {
  const release = jest.fn();
  const acquire = jest.fn(async () => ({ release }));
  return { acquire, release };
}

test('withBrowserSlot runs the operation in a browser slot and releases it after', async () => {
  const { acquire, release } = fakeAcquire();
  const task = jest.fn(async () => {
    expect(release).not.toHaveBeenCalled();
    return { data: 'png' };
  });
  await expect(withBrowserSlot({ task, acquire })).resolves.toEqual({ data: 'png' });
  expect(acquire).toHaveBeenCalledWith({ name: 'browser', limit: 3, waitMs: 300000 });
  expect(release).toHaveBeenCalledTimes(1);
});

test('withBrowserSlot releases the slot when the operation throws', async () => {
  const { acquire, release } = fakeAcquire();
  const task = async () => {
    throw new Error('Navigation timeout of 15000 ms exceeded');
  };
  await expect(withBrowserSlot({ task, acquire })).rejects.toThrow('Navigation timeout');
  expect(release).toHaveBeenCalledTimes(1);
});

test('withBrowserSlot answers a slot wait that outlasts its limit as the operation error', async () => {
  const acquire = async () => {
    throw new Error('All 3 browser slots on this machine stayed busy for 5 minutes. Try again.');
  };
  const task = jest.fn();
  await expect(withBrowserSlot({ task, acquire })).resolves.toEqual({
    error: 'All 3 browser slots on this machine stayed busy for 5 minutes. Try again.',
  });
  expect(task).not.toHaveBeenCalled();
});

test('withBrowserSlot takes real machine slots and frees them', async () => {
  const sharedHome = process.env.LOWDEFY_HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-browser-slot-'));
  process.env.LOWDEFY_HOME = home;
  try {
    const slots = path.join(home, 'slots', 'browser');
    const result = await withBrowserSlot({ task: async () => fs.readdirSync(slots) });
    expect(result).toEqual(['0']);
    expect(fs.readdirSync(slots)).toEqual([]);
  } finally {
    process.env.LOWDEFY_HOME = sharedHome;
    fs.rmSync(home, { recursive: true, force: true });
  }
});
