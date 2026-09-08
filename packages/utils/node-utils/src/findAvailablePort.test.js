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
import findAvailablePort from './findAvailablePort.js';

function listen(port, host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

test('findAvailablePort returns the requested port when it is free', async () => {
  const free = await getFreePort();
  const port = await findAvailablePort({ port: free });
  expect(port).toBe(free);
});

test('findAvailablePort increments past a busy port to the next free one', async () => {
  const free = await getFreePort();
  const server = await listen(free);
  try {
    const port = await findAvailablePort({ port: free });
    expect(port).toBeGreaterThan(free);
  } finally {
    await close(server);
  }
});

test('findAvailablePort increments past a port held on 127.0.0.1 only', async () => {
  // SO_REUSEADDR lets a wildcard probe bind while 127.0.0.1 is held (how Vite
  // binds `localhost`), which reported the port as available and crashed the
  // strictPort dev server.
  const free = await getFreePort();
  const server = await listen(free, '127.0.0.1');
  try {
    const port = await findAvailablePort({ port: free });
    expect(port).toBeGreaterThan(free);
  } finally {
    await close(server);
  }
});

test('findAvailablePort increments past a port held on ::1 only', async () => {
  // Vite resolving `localhost` can land on the IPv6 loopback alone, so a
  // wildcard or IPv4-only probe misses it.
  const free = await getFreePort();
  const server = await listen(free, '::1');
  try {
    const port = await findAvailablePort({ port: free });
    expect(port).toBeGreaterThan(free);
  } finally {
    await close(server);
  }
});

test('findAvailablePort throws when no port is free within maxAttempts', async () => {
  const free = await getFreePort();
  const server = await listen(free);
  try {
    await expect(findAvailablePort({ port: free, maxAttempts: 1 })).rejects.toThrow(
      'No available port found'
    );
  } finally {
    await close(server);
  }
});
