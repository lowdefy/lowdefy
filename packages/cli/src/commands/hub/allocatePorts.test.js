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

// The port probe is stubbed: real sockets made these tests flaky on CI, where
// other test processes can hold any port in the OS ephemeral range.
const busy = new Set();

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  isPortAvailable: async ({ port }) => !busy.has(port),
}));

const { default: allocatePorts } = await import('./allocatePorts.js');

const first = 4100;
const range = { first, last: first + 20 };

beforeEach(() => {
  busy.clear();
});

test('allocatePorts keeps the previous pair when both ports are free', async () => {
  const previous = { port: first + 4, internalPort: first + 5 };
  expect(await allocatePorts({ previous, reserved: [], range })).toEqual(previous);
});

test('allocatePorts moves when the previous pair is taken', async () => {
  busy.add(first + 2);
  const pair = await allocatePorts({
    previous: { port: first + 2, internalPort: first + 3 },
    reserved: [],
    range,
  });
  expect(pair).toEqual({ port: first, internalPort: first + 1 });
});

test('allocatePorts moves when only the internal port of the previous pair is taken', async () => {
  busy.add(first + 3);
  const pair = await allocatePorts({
    previous: { port: first + 2, internalPort: first + 3 },
    reserved: [],
    range,
  });
  expect(pair).toEqual({ port: first, internalPort: first + 1 });
});

test('allocatePorts skips pairs held by other processes', async () => {
  busy.add(first);
  busy.add(first + 3);
  expect(await allocatePorts({ reserved: [], range })).toEqual({
    port: first + 4,
    internalPort: first + 5,
  });
});

test('allocatePorts never hands out a pair another app has reserved', async () => {
  const firstPair = await allocatePorts({ reserved: [], range });
  const second = await allocatePorts({ reserved: [firstPair], range });
  expect(firstPair).toEqual({ port: first, internalPort: first + 1 });
  expect(second).toEqual({ port: first + 2, internalPort: first + 3 });
});

test('allocatePorts fails with the way out when the range is used up', async () => {
  await expect(
    allocatePorts({
      reserved: [{ port: first, internalPort: first + 1 }],
      range: { first, last: first + 2 },
    })
  ).rejects.toThrow('lowdefy hub stop --all');
});
