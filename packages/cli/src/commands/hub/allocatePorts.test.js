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

import net from 'net';

import allocatePorts from './allocatePorts.js';

// Clear of the hub's real 4100-4999, which hubs in other worktrees use.
const first = 20000 + 2 * Math.floor(Math.random() * 15000);
const range = { first, last: first + 20 };

function listen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

test('allocatePorts keeps the previous pair when both ports are free', async () => {
  const previous = { port: first + 4, internalPort: first + 5 };
  expect(await allocatePorts({ previous, reserved: [], range })).toEqual(previous);
});

test('allocatePorts moves when the previous pair is taken', async () => {
  const server = await listen(first + 2);
  try {
    const pair = await allocatePorts({
      previous: { port: first + 2, internalPort: first + 3 },
      reserved: [],
      range,
    });
    expect(pair.port).not.toEqual(first + 2);
    expect(pair.internalPort).toEqual(pair.port + 1);
  } finally {
    server.close();
  }
});

test('allocatePorts never hands out a pair another app has reserved', async () => {
  const firstPair = await allocatePorts({ reserved: [], range });
  const second = await allocatePorts({ reserved: [firstPair], range });
  expect(second.port).not.toEqual(firstPair.port);
  expect(second.port).toBeGreaterThanOrEqual(range.first);
});

test('allocatePorts fails with the way out when the range is used up', async () => {
  await expect(
    allocatePorts({
      reserved: [{ port: first, internalPort: first + 1 }],
      range: { first, last: first + 2 },
    })
  ).rejects.toThrow('lowdefy hub stop --all');
});
