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

import net from 'node:net';
import { jest } from '@jest/globals';

import { closeClients } from '../../../connections/MongoDBCollection/getClient.js';

// The vendored adapter is replaced by the getDb function it receives, so the test
// drives the real driver directly.
const mockMongodbAdapter = jest.fn(({ getDb }) => getDb);

jest.unstable_mockModule('../mongodbAdapter/mongodbAdapter.js', () => ({
  default: mockMongodbAdapter,
}));

// A TCP proxy in front of the test server that drops every connection until it
// is opened: a first connect that fails, then a server that is reachable.
async function startGatedProxy({ host, port }) {
  let open = false;
  const sockets = new Set();
  function track(socket) {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => socket.destroy());
  }
  const server = net.createServer((socket) => {
    track(socket);
    if (!open) {
      socket.destroy();
      return;
    }
    const upstream = net.connect({ host, port });
    track(upstream);
    upstream.on('close', () => socket.destroy());
    socket.on('close', () => upstream.destroy());
    socket.pipe(upstream).pipe(socket);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    port: server.address().port,
    open() {
      open = true;
    },
    close() {
      sockets.forEach((socket) => socket.destroy());
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

let proxy;

afterEach(async () => {
  await closeClients();
  await proxy?.close();
  proxy = undefined;
});

// Real driver, unreachable server: the first operation's connect fails. Unless the
// failed client is evicted, every later operation fails for the life of the
// process instead of trying again - with MongoTopologyClosedError, or by
// re-throwing the first error from a rejected connect promise.
test('MongoDBAuthAdapter connects afresh after a failed first connect', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const getDb = MongoDBAuthAdapter({
    properties: {
      uri: 'mongodb://127.0.0.1:1/?directConnection=true',
      database: 'auth',
      mongoDBClientOptions: { serverSelectionTimeoutMS: 100, connectTimeoutMS: 100 },
    },
  });
  const findUser = async () =>
    (await getDb()).collection('user').findOne({ email: 'a@example.com' });
  const first = await findUser().catch((error) => error);
  const second = await findUser().catch((error) => error);
  expect(first).toMatchObject({ name: 'MongoServerSelectionError' });
  expect(second).toMatchObject({ name: 'MongoServerSelectionError' });
  expect(second).not.toBe(first);
});

test('MongoDBAuthAdapter serves again once the server is reachable, after the requests that raced the failed connect', async () => {
  const target = new URL(process.env.MONGO_URL);
  proxy = await startGatedProxy({ host: target.hostname, port: Number(target.port) });
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const getDb = MongoDBAuthAdapter({
    properties: {
      uri: `mongodb://127.0.0.1:${proxy.port}/?directConnection=true`,
      database: 'auth',
      mongoDBClientOptions: { serverSelectionTimeoutMS: 200, connectTimeoutMS: 200 },
    },
  });
  const findUser = async () =>
    (await getDb()).collection('user').findOne({ email: 'a@example.com' });
  // The requests that raced the failed connect share its client and fail with it.
  const raced = await Promise.allSettled([findUser(), findUser(), findUser()]);
  expect(raced.map(({ status }) => status)).toEqual(['rejected', 'rejected', 'rejected']);
  proxy.open();
  await expect(findUser()).resolves.toBeNull();
  await expect(findUser()).resolves.toBeNull();
});
