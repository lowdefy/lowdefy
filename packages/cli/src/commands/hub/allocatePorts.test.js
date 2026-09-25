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

function listen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

test('allocatePorts keeps the previous pair when both ports are free', async () => {
  expect(
    await allocatePorts({ previous: { port: 4400, internalPort: 4401 }, reserved: [] })
  ).toEqual({
    port: 4400,
    internalPort: 4401,
  });
});

test('allocatePorts moves when the previous pair is taken', async () => {
  const server = await listen(4402);
  try {
    const pair = await allocatePorts({
      previous: { port: 4402, internalPort: 4403 },
      reserved: [],
    });
    expect(pair.port).not.toEqual(4402);
    expect(pair.internalPort).toEqual(pair.port + 1);
  } finally {
    server.close();
  }
});

test('allocatePorts never hands out a pair another app has reserved', async () => {
  const first = await allocatePorts({ reserved: [] });
  const second = await allocatePorts({ reserved: [first] });
  expect(second.port).not.toEqual(first.port);
  expect(second.port).toBeGreaterThanOrEqual(4100);
});
