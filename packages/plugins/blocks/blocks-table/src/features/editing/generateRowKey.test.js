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
import { webcrypto } from 'crypto';
import { jest } from '@jest/globals';

import generateRowKey from './generateRowKey.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  delete global.window;
});

test('generateRowKey returns crypto.randomUUID when the browser has it', () => {
  global.window = {
    crypto: {
      randomUUID: () => '1b4e28ba-2fa1-41d2-883f-0016d3cca427',
      getRandomValues: jest.fn(),
    },
  };
  expect(generateRowKey()).toBe('1b4e28ba-2fa1-41d2-883f-0016d3cca427');
  expect(global.window.crypto.getRandomValues).not.toHaveBeenCalled();
});

test('generateRowKey builds a v4 UUID from random bytes when randomUUID is missing', () => {
  global.window = {
    crypto: { getRandomValues: (array) => webcrypto.getRandomValues(array) },
  };
  const keys = new Set();
  for (let index = 0; index < 50; index += 1) {
    const key = generateRowKey();
    expect(key).toMatch(UUID_V4);
    keys.add(key);
  }
  expect(keys.size).toBe(50);
});

test('generateRowKey sets the version and variant bits whatever the random bytes are', () => {
  global.window = { crypto: { getRandomValues: (array) => array.fill(0xff) } };
  expect(generateRowKey()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  global.window = { crypto: { getRandomValues: (array) => array.fill(0) } };
  expect(generateRowKey()).toBe('00000000-0000-4000-8000-000000000000');
});
