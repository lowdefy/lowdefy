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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';

import describeTargetKey from './describeTargetKey.js';
import findSessionDocuments from './findSessionDocuments.js';

const shopTarget = describeTargetKey({ properties: { databaseUri: 'mongodb://a/shop' } });
const auditTarget = describeTargetKey({ properties: { databaseUri: 'mongodb://b/audit' } });

let buildDirectory;

function writeConnection(artifact) {
  fs.writeFileSync(
    path.join(buildDirectory, 'connections', `${artifact.connectionId}.json`),
    JSON.stringify(artifact)
  );
}

beforeAll(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'find-session-documents-'));
  fs.mkdirSync(path.join(buildDirectory, 'connections'));
  writeConnection({
    connectionId: 'orders',
    type: 'MongoDBCollection',
    properties: { databaseUri: 'mongodb://a/shop', collection: 'orders' },
  });
  writeConnection({
    connectionId: 'audit',
    type: 'MongoDBCollection',
    properties: { databaseUri: 'mongodb://b/audit', collection: 'events' },
  });
  writeConnection({ connectionId: 'api', type: 'AxiosHttp', properties: {} });
});

afterAll(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

// A MongoDB client that records what it was asked for and answers with `documents`.
function createClient(documents) {
  const asked = {};
  const client = {
    db: (name) => {
      asked.database = name;
      return {
        collection: (collection) => {
          asked.collection = collection;
          return {
            find: (match) => {
              asked.match = match;
              return {
                sort: (sort) => {
                  asked.sort = sort;
                  return { toArray: async () => documents };
                },
              };
            },
          };
        },
      };
    },
  };
  return { asked, client };
}

function createSession({ targets }) {
  return {
    databaseName: 'ld_x_0',
    prefix: 'ld_x',
    databases: new Map(targets.map((target, index) => [target, `ld_x_${index}`])),
    databaseCount: Math.max(targets.length, 1),
  };
}

test('findSessionDocuments reads the connection target database, in _id order, as JSON values', async () => {
  const { asked, client } = createClient([
    { _id: { toJSON: () => '64b7f0c2a1b2c3d4e5f60718' }, at: new Date('2026-01-02T03:04:05Z') },
  ]);
  const session = createSession({
    targets: [shopTarget, auditTarget],
  });
  const documents = await findSessionDocuments({
    buildDirectory,
    client,
    collection: 'events',
    connectionId: 'audit',
    match: { kind: 'login' },
    session,
  });
  expect(documents).toEqual([{ _id: '64b7f0c2a1b2c3d4e5f60718', at: '2026-01-02T03:04:05.000Z' }]);
  expect(asked).toEqual({
    database: 'ld_x_1',
    collection: 'events',
    match: { kind: 'login' },
    sort: { _id: 1 },
  });
});

test('findSessionDocuments reads the one database of a session without a connectionId', async () => {
  const { asked, client } = createClient([]);
  await findSessionDocuments({
    buildDirectory,
    client,
    collection: 'orders',
    match: {},
    session: createSession({ targets: [shopTarget] }),
  });
  expect(asked.database).toBe('ld_x_0');
});

test('findSessionDocuments needs a connectionId when the session has several databases', async () => {
  const { client } = createClient([]);
  await expect(
    findSessionDocuments({
      buildDirectory,
      client,
      collection: 'orders',
      match: {},
      session: createSession({ targets: ['a', 'b'] }),
    })
  ).rejects.toThrow(
    'The app\'s connections write to 2 databases: name the "connectionId" whose database to read, one of "audit", "orders".'
  );
});

test('findSessionDocuments refuses a connection that is not a MongoDBCollection', async () => {
  const { client } = createClient([]);
  await expect(
    findSessionDocuments({
      buildDirectory,
      client,
      collection: 'orders',
      connectionId: 'api',
      match: {},
      session: createSession({ targets: [] }),
    })
  ).rejects.toThrow(
    'Connection "api" is not a MongoDBCollection connection of this app. Its MongoDBCollection connections are "audit", "orders".'
  );
});
