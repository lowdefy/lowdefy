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
import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';
import { serializer } from '@lowdefy/helpers';

import seedFixtures from './seedFixtures.js';

let devDirectory;
let calls;
let dropError;
let client;

function writeConnection(connection) {
  const filePath = path.join(
    devDirectory,
    'build',
    'connections',
    `${connection.connectionId}.json`
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, serializer.serializeToString(connection));
}

beforeEach(() => {
  devDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-seed-'));
  calls = [];
  dropError = null;
  client = {
    db: jest.fn((databaseName) => ({
      collection: jest.fn((collection) => ({
        drop: jest.fn(async () => {
          calls.push({ op: 'drop', databaseName, collection });
          if (dropError) {
            throw dropError;
          }
        }),
        insertMany: jest.fn(async (documents) => {
          calls.push({ op: 'insertMany', databaseName, collection, documents });
        }),
      })),
    })),
  };
});

afterEach(() => {
  fs.rmSync(devDirectory, { recursive: true, force: true });
});

test('seedFixtures drops the collection before inserting and inserts ~d values as Dates', async () => {
  writeConnection({
    connectionId: 'controls',
    type: 'MongoDBCollection',
    properties: {
      databaseUri: { _secret: 'URI' },
      collection: 'controls_col',
      databaseName: 'app',
    },
  });
  await seedFixtures({
    client,
    devDirectory,
    seed: {
      controls: [{ _id: 'c1', created_at: { '~d': '2026-01-01T00:00:00.000Z' } }, { _id: 'c2' }],
    },
  });
  expect(calls.map((call) => call.op)).toEqual(['drop', 'insertMany']);
  expect(calls[1].databaseName).toEqual('app');
  expect(calls[1].collection).toEqual('controls_col');
  expect(calls[1].documents[0].created_at).toBeInstanceOf(Date);
  expect(calls[1].documents[0].created_at.toISOString()).toEqual('2026-01-01T00:00:00.000Z');
  expect(calls[1].documents[1]).toEqual({ _id: 'c2' });
});

test('seedFixtures uses the driver default database when databaseName is not set', async () => {
  writeConnection({ connectionId: 'users', properties: { collection: 'users' } });
  await seedFixtures({ client, devDirectory, seed: { users: [{ _id: 'u1' }] } });
  expect(client.db).toHaveBeenCalledWith(undefined);
});

test('seedFixtures tolerates dropping a collection that does not exist yet', async () => {
  writeConnection({ connectionId: 'users', properties: { collection: 'users' } });
  dropError = Object.assign(new Error('ns not found'), { code: 26, codeName: 'NamespaceNotFound' });
  await seedFixtures({ client, devDirectory, seed: { users: [{ _id: 'u1' }] } });
  expect(calls.map((call) => call.op)).toEqual(['drop', 'insertMany']);
});

test('seedFixtures rethrows other drop failures', async () => {
  writeConnection({ connectionId: 'users', properties: { collection: 'users' } });
  dropError = Object.assign(new Error('not authorized'), { code: 13 });
  await expect(
    seedFixtures({ client, devDirectory, seed: { users: [{ _id: 'u1' }] } })
  ).rejects.toThrow('not authorized');
});

test('seedFixtures drops but does not insert for an empty document list', async () => {
  writeConnection({ connectionId: 'users', properties: { collection: 'users' } });
  await seedFixtures({ client, devDirectory, seed: { users: [] } });
  expect(calls.map((call) => call.op)).toEqual(['drop']);
});

test('seedFixtures reports an operator-valued collection with the exact message', async () => {
  writeConnection({
    connectionId: 'controls',
    properties: { collection: { _state: 'collection' } },
  });
  await expect(
    seedFixtures({ client, devDirectory, seed: { controls: [{ _id: 'c1' }] } })
  ).rejects.toThrow(
    'Connection "controls" resolves its collection with an operator, so a seed cannot target it. Use a literal "collection" property, or seed through a request.'
  );
  expect(calls).toEqual([]);
});

test('seedFixtures reports an operator-valued databaseName', async () => {
  writeConnection({
    connectionId: 'controls',
    properties: { collection: 'controls', databaseName: { _secret: 'DB' } },
  });
  await expect(seedFixtures({ client, devDirectory, seed: { controls: [] } })).rejects.toThrow(
    'Connection "controls" resolves its databaseName with an operator'
  );
});

test('seedFixtures reports a connection that is not in the build', async () => {
  await expect(seedFixtures({ client, devDirectory, seed: { missing: [] } })).rejects.toThrow(
    'Connection "missing" was not found in the build. Seeds are keyed by connectionId.'
  );
});

test('seedFixtures drops every collection once, then inserts fixtures in list order before seed', async () => {
  writeConnection({ connectionId: 'organizations', properties: { collection: 'orgs' } });
  writeConnection({ connectionId: 'controls', properties: { collection: 'controls' } });
  writeConnection({ connectionId: 'answers', properties: { collection: 'answers' } });
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  await seedFixtures({
    client,
    devDirectory,
    fixtures: [
      {
        name: 'base',
        connections: [
          { connectionId: 'organizations', docs: [{ _id: 'org_a', created_at: createdAt }] },
          { connectionId: 'controls', docs: [{ _id: 'c1' }] },
        ],
      },
      {
        name: 'org-a',
        connections: [{ connectionId: 'controls', docs: [{ _id: 'c2' }] }],
      },
    ],
    seed: {
      answers: [{ _id: 'a1', at: { '~d': '2026-02-01T00:00:00.000Z' } }],
      controls: [{ _id: 'c3' }],
    },
  });
  expect(calls.map((call) => `${call.op}:${call.collection}`)).toEqual([
    'drop:orgs',
    'drop:controls',
    'drop:answers',
    'insertMany:orgs',
    'insertMany:controls',
    'insertMany:controls',
    'insertMany:answers',
    'insertMany:controls',
  ]);
  expect(calls[3].documents[0].created_at).toBe(createdAt);
  expect(calls[4].documents).toEqual([{ _id: 'c1' }]);
  expect(calls[5].documents).toEqual([{ _id: 'c2' }]);
  expect(calls[6].documents[0].at).toBeInstanceOf(Date);
  expect(calls[7].documents).toEqual([{ _id: 'c3' }]);
});

test('seedFixtures works with fixtures and no seed', async () => {
  writeConnection({ connectionId: 'users', properties: { collection: 'users' } });
  await seedFixtures({
    client,
    devDirectory,
    fixtures: [{ name: 'base', connections: [{ connectionId: 'users', docs: [{ _id: 'u1' }] }] }],
  });
  expect(calls.map((call) => call.op)).toEqual(['drop', 'insertMany']);
  expect(calls[1].documents).toEqual([{ _id: 'u1' }]);
});

test('seedFixtures fails a fixture on an operator-valued collection before touching the database', async () => {
  writeConnection({ connectionId: 'users', properties: { collection: 'users' } });
  writeConnection({
    connectionId: 'controls',
    properties: { collection: { _state: 'collection' } },
  });
  await expect(
    seedFixtures({
      client,
      devDirectory,
      fixtures: [
        {
          name: 'base',
          connections: [
            { connectionId: 'users', docs: [{ _id: 'u1' }] },
            { connectionId: 'controls', docs: [{ _id: 'c1' }] },
          ],
        },
      ],
    })
  ).rejects.toThrow(
    'Connection "controls" resolves its collection with an operator, so a seed cannot target it. Use a literal "collection" property, or seed through a request.'
  );
  expect(calls).toEqual([]);
});
