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

import { expect, test } from 'vitest';

import settleAll from './settleAll.js';

test('settleAll returns every value when all resolve', async () => {
  await expect(settleAll([Promise.resolve(1), Promise.resolve(2)])).resolves.toEqual([1, 2]);
});

test('settleAll throws the first rejection only once every promise has settled', async () => {
  let slowDone = false;
  const slow = new Promise((resolve) => {
    setTimeout(() => {
      slowDone = true;
      resolve();
    }, 20);
  });
  const error = new Error('load failed');
  await expect(settleAll([Promise.reject(error), slow])).rejects.toBe(error);
  expect(slowDone).toBe(true);
});
