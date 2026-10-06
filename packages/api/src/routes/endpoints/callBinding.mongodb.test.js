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

// A verified webhook calls an endpoint bound to an organization as a named
// stand-in caller, against a real MongoDB through the stock walled connection
// (pnpm test:mongodb): the walled insert is stamped with the bound
// organization, the walled read returns only its rows, and the change log
// records the stand-in as the user.

import { jest } from '@jest/globals';
import * as mongodb from 'mongodb';

// The connection keeps its client for the process lifetime, so the test
// records every client it creates and closes them afterwards.
const clients = [];
class RecordingMongoClient extends mongodb.MongoClient {
  constructor(...args) {
    super(...args);
    clients.push(this);
  }
}

jest.unstable_mockModule('mongodb', () => ({ ...mongodb, MongoClient: RecordingMongoClient }));

const { MongoDBCollection } = await import('@lowdefy/connection-mongodb/connections');
const { operatorsServer } = await import('@lowdefy/operators-js');
const { default: runWebhookEndpoint } = await import('./runWebhookEndpoint.js');
const { default: testContext } = await import('../../test/testContext.js');

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const verify = ({ request }) => request.token === 'good';
verify.schema = {};
verify.meta = { checkRead: false, checkWrite: false };

let client;
let database;

beforeAll(async () => {
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
  database = client.db('callBinding');
  await database.collection('events').insertMany([
    { _id: 'a1', title: 'org 1 row', organization_id: 'org-1' },
    { _id: 'b1', title: 'org 2 row', organization_id: 'org-2' },
  ]);
});

afterAll(async () => {
  await database.dropDatabase();
  await Promise.all([client, ...clients].map((each) => each.close()));
});

const files = {
  'api/hook.json': {
    endpointId: 'hook',
    type: 'Api',
    auth: { public: true },
    webhook: {
      verify: {
        connectionId: 'verifier',
        type: 'Verify',
        properties: { token: { _payload: 'query.token' } },
      },
    },
    routine: [
      {
        id: 'endpoint:hook:process',
        stepId: 'process',
        type: 'CallApi',
        properties: {
          endpointId: 'process',
          organization: { _payload: 'body.organization' },
          caller: { id: 'github', name: 'GitHub' },
        },
      },
      { ':return': { _step: 'process' } },
    ],
  },
  'api/process.json': {
    endpointId: 'process',
    type: 'InternalApi',
    auth: { public: false },
    routine: [
      {
        id: 'request:process:insert',
        stepId: 'insert',
        type: 'MongoDBInsertOne',
        connectionId: 'events',
        properties: { doc: { _id: 'new', title: 'from GitHub' } },
      },
      {
        id: 'request:process:read',
        stepId: 'read',
        type: 'MongoDBFind',
        connectionId: 'events',
        properties: { query: {}, options: { sort: { _id: 1 } } },
      },
      { ':return': { user: { _user: true }, rows: { _step: 'read' } } },
    ],
  },
  'connections/events.json': {
    id: 'connection:events',
    type: 'MongoDBCollection',
    connectionId: 'events',
    properties: {
      databaseUri: { _secret: 'MONGO_URL' },
      databaseName: 'callBinding',
      collection: 'events',
      read: true,
      write: true,
      changeLog: {
        collection: 'events_log',
        meta: { user: { _user: true } },
      },
    },
  },
  'connections/verifier.json': {
    id: 'connection:verifier',
    type: 'VerifyConnection',
    connectionId: 'verifier',
    properties: {},
  },
};

test('a verified webhook binds a CallApi to an organization with a stand-in caller against a real walled collection', async () => {
  const context = testContext({
    logger,
    connections: {
      MongoDBCollection,
      VerifyConnection: { schema: true, meta: { tenant: false }, requests: { Verify: verify } },
    },
    operators: operatorsServer,
    organization: { policy: 'tenant' },
    readConfigFile: jest.fn((path) => files[path] ?? null),
    secrets: { MONGO_URL: process.env.MONGO_URL },
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook',
    rawBody: JSON.stringify({ organization: 'org-1' }),
    query: { token: 'good' },
    headers: {},
  });
  expect(logger.error).not.toHaveBeenCalled();
  expect(result.status).toBe(200);
  const standIn = { id: 'github', name: 'GitHub', organization_id: 'org-1', system: true };
  expect(result.body.user).toEqual(standIn);
  expect(result.body.rows).toEqual([
    { _id: 'a1', title: 'org 1 row', organization_id: 'org-1' },
    { _id: 'new', title: 'from GitHub', organization_id: 'org-1' },
  ]);
  expect(await database.collection('events').findOne({ _id: 'new' })).toEqual({
    _id: 'new',
    title: 'from GitHub',
    organization_id: 'org-1',
  });
  const log = await database.collection('events_log').findOne({});
  expect(log.meta.user).toEqual(standIn);
  expect(log.organization_id).toBe('org-1');
});
