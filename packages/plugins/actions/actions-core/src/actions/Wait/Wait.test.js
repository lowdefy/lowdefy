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

import Wait from './Wait.js';
import { expect, test, vi } from 'vitest';

test('Wait calls the wait method with ms and returns its promise', async () => {
  const wait = vi.fn(() => Promise.resolve());
  const res = Wait({ methods: { wait }, params: { ms: 500 } });
  expect(wait.mock.calls).toEqual([[{ ms: 500 }]]);
  await expect(res).resolves.toBeUndefined();
});

test('Wait throws when params are undefined', () => {
  const wait = vi.fn();
  expect(() => Wait({ methods: { wait } })).toThrow('Wait action "ms" param should be an integer.');
  expect(wait).not.toHaveBeenCalled();
});

test('Wait throws when params.ms is not an integer', () => {
  const wait = vi.fn();
  expect(() => Wait({ methods: { wait }, params: { key: 'value' } })).toThrow(
    'Wait action "ms" param should be an integer.'
  );
  expect(wait).not.toHaveBeenCalled();
});
