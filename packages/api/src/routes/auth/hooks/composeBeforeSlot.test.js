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

import { jest } from '@jest/globals';

import composeAfterSlot from './composeAfterSlot.js';
import composeBeforeSlot from './composeBeforeSlot.js';

test('composeBeforeSlot threads the record - each hook sees the previous return', async () => {
  const calls = [];
  const slot = composeBeforeSlot({
    hooks: [
      async (record) => {
        calls.push(record);
        return { data: { ...record, engine: true } };
      },
      async (record) => {
        calls.push(record);
        return { data: { ...record, user: true } };
      },
    ],
  });
  const result = await slot({ name: 'A' });
  expect(calls).toEqual([{ name: 'A' }, { name: 'A', engine: true }]);
  expect(result).toEqual({ data: { name: 'A', engine: true, user: true } });
});

test('composeBeforeSlot passes the record on unchanged when a hook falls through', async () => {
  const slot = composeBeforeSlot({
    hooks: [async () => undefined, async (record) => ({ data: { ...record, touched: true } })],
  });
  const result = await slot({ name: 'A' });
  expect(result).toEqual({ data: { name: 'A', touched: true } });
});

test('composeBeforeSlot short-circuits on the first hook returning false', async () => {
  const second = jest.fn();
  const slot = composeBeforeSlot({
    hooks: [async () => false, second],
  });
  const result = await slot({ name: 'A' });
  expect(result).toBe(false);
  expect(second).not.toHaveBeenCalled();
});

test('composeBeforeSlot lets a thrown error propagate and skips later hooks', async () => {
  const second = jest.fn();
  const slot = composeBeforeSlot({
    hooks: [
      async () => {
        throw new Error('veto');
      },
      second,
    ],
  });
  await expect(slot({ name: 'A' })).rejects.toThrow('veto');
  expect(second).not.toHaveBeenCalled();
});

test('composeAfterSlot runs hooks in order and ignores return values', async () => {
  const calls = [];
  const slot = composeAfterSlot({
    hooks: [
      async (data) => {
        calls.push(['engine', data]);
        return 'ignored';
      },
      async (data) => {
        calls.push(['user', data]);
      },
    ],
  });
  const ctx = { context: {} };
  await expect(slot({ id: 's1' }, ctx)).resolves.toBeUndefined();
  expect(calls).toEqual([
    ['engine', { id: 's1' }],
    ['user', { id: 's1' }],
  ]);
});

test('composeAfterSlot lets a thrown error propagate', async () => {
  const slot = composeAfterSlot({
    hooks: [
      async () => {
        throw new Error('audit failed');
      },
    ],
  });
  await expect(slot({ id: 's1' })).rejects.toThrow('audit failed');
});
