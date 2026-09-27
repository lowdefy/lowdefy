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
import * as mongodb from 'mongodb';

// The real driver, recording every client the adapter creates so the test can
// count replacements and close them all afterwards.
const clients = [];
class RecordingMongoClient extends mongodb.MongoClient {
  constructor(...args) {
    super(...args);
    clients.push(this);
  }
}

const mockMongodbAdapter = jest.fn(({ db }) => db);

jest.unstable_mockModule('mongodb', () => ({ ...mongodb, MongoClient: RecordingMongoClient }));

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
  await Promise.all(clients.splice(0).map((client) => client.close()));
  await proxy?.close();
  proxy = undefined;
});

// Real driver, unreachable server: the first operation's auto-connect fails and
// the driver closes the client's topology. Without a replacement client every
// later operation throws MongoTopologyClosedError instead of trying again.
test('MongoDBAuthAdapter connects afresh after a failed first connect', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const db = MongoDBAuthAdapter({
    properties: {
      uri: 'mongodb://127.0.0.1:1/?directConnection=true',
      database: 'auth',
      mongoDBClientOptions: { serverSelectionTimeoutMS: 100, connectTimeoutMS: 100 },
    },
  });
  const findUser = () => db.collection('user').findOne({ email: 'a@example.com' });
  await expect(findUser()).rejects.toMatchObject({ name: 'MongoServerSelectionError' });
  await expect(findUser()).rejects.toMatchObject({ name: 'MongoServerSelectionError' });
});

test('MongoDBAuthAdapter serves again once the server is reachable, replacing the failed client once for all requests that raced it', async () => {
  const target = new URL(process.env.MONGO_URL);
  proxy = await startGatedProxy({ host: target.hostname, port: Number(target.port) });
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const db = MongoDBAuthAdapter({
    properties: {
      uri: `mongodb://127.0.0.1:${proxy.port}/?directConnection=true`,
      database: 'auth',
      mongoDBClientOptions: { serverSelectionTimeoutMS: 200, connectTimeoutMS: 200 },
    },
  });
  const findUser = () => db.collection('user').findOne({ email: 'a@example.com' });
  // The requests that raced the failed connect all fail on the old client (the
  // first with the connect error, the rest with its closed topology).
  const raced = await Promise.allSettled([findUser(), findUser(), findUser()]);
  expect(raced.map(({ status }) => status)).toEqual(['rejected', 'rejected', 'rejected']);
  expect(clients).toHaveLength(2);
  proxy.open();
  await expect(findUser()).resolves.toBeNull();
  await expect(findUser()).resolves.toBeNull();
  expect(clients).toHaveLength(2);
});
