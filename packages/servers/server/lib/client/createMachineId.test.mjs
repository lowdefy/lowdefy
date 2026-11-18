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

import { afterEach, expect, test, vi } from 'vitest';

import createMachineId from './createMachineId.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.restoreAllMocks();
});

test('createMachineId returns a version 4 UUID', () => {
  for (let i = 0; i < 100; i += 1) {
    expect(createMachineId()).toMatch(UUID_V4);
  }
});

test('createMachineId returns a different id on each call', () => {
  const ids = new Set(Array.from({ length: 100 }, () => createMachineId()));
  expect(ids.size).toBe(100);
});

test('createMachineId sets the version and variant bits over all-ones and all-zero bytes', () => {
  vi.spyOn(crypto, 'getRandomValues').mockImplementationOnce((bytes) => bytes.fill(0xff));
  expect(createMachineId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  vi.spyOn(crypto, 'getRandomValues').mockImplementationOnce((bytes) => bytes.fill(0));
  expect(createMachineId()).toBe('00000000-0000-4000-8000-000000000000');
});

// A plain-HTTP origin that is not localhost is not a secure context, and the browser leaves
// crypto.randomUUID undefined there.
test('createMachineId works where crypto.randomUUID is undefined', () => {
  // randomUUID lives on Crypto.prototype: an own property on the instance shadows it.
  Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
  try {
    expect(crypto.randomUUID).toBeUndefined();
    expect(createMachineId()).toMatch(UUID_V4);
  } finally {
    delete crypto.randomUUID;
  }
});
