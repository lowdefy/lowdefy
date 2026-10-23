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

import { vi, expect, test } from 'vitest';
import awaitUnlessUnloading from './awaitUnlessUnloading.js';

test('awaitUnlessUnloading resolves with the value of a fulfilled promise', async () => {
  await expect(
    awaitUnlessUnloading({ lowdefy: { unloading: false }, promise: Promise.resolve(1) })
  ).resolves.toBe(1);
});

test('awaitUnlessUnloading rethrows a rejection while the page stays open', async () => {
  const error = new TypeError('Failed to fetch');
  await expect(
    awaitUnlessUnloading({ lowdefy: { unloading: false }, promise: Promise.reject(error) })
  ).rejects.toBe(error);
});

test('awaitUnlessUnloading never settles on a rejection while the page unloads', async () => {
  const settled = vi.fn();
  awaitUnlessUnloading({
    lowdefy: { unloading: true },
    promise: Promise.reject(new TypeError('Failed to fetch')),
  }).then(settled, settled);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(settled).not.toHaveBeenCalled();
});
