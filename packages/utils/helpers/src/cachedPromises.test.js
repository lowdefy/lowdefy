/*
  Copyright 2020-2024 Lowdefy, Inc

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

import createCachedPromises from './cachedPromises.js';
import wait from './wait.js';

test('cachedPromises calls getter with key', async () => {
  const cache = new Map();
  const getter = jest.fn(() => Promise.resolve('value'));
  const cachedGetter = createCachedPromises({ cache, getter });
  const promise = cachedGetter('key');
  expect(`${promise}`).toEqual('[object Promise]');
  const result = await promise;
  expect(result).toEqual('value');
  expect(getter.mock.calls).toEqual([['key']]);
});

test('cachedPromises only calls getter once', async () => {
  const cache = new Map();

  const getter = jest.fn(() => Promise.resolve('value'));
  const cachedGetter = createCachedPromises({ cache, getter });
  const result1 = await cachedGetter('key');
  expect(result1).toEqual('value');
  const result2 = await cachedGetter('key');
  expect(result2).toEqual('value');
  expect(getter.mock.calls).toEqual([['key']]);
});

test('getter is called once if first call has not yet resolved', async () => {
  const cache = new Map();

  const getter = jest.fn(async () => {
    await wait(10);
    return 'value';
  });
  const cachedGetter = createCachedPromises({ cache, getter });
  const promise1 = cachedGetter('key');
  const promise2 = cachedGetter('key');
  expect(getter.mock.calls).toEqual([['key']]);
  await promise1;
  await promise2;
  expect(getter.mock.calls).toEqual([['key']]);
});
