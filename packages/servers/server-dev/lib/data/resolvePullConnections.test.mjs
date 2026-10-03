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

import resolvePullConnections from './resolvePullConnections.mjs';

let buildDirectory;

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-pull-connections-'));
  fs.mkdirSync(path.join(buildDirectory, 'connections'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

function writeConnection(connectionId, properties, connectionType = 'MongoDBCollection') {
  fs.writeFileSync(
    path.join(buildDirectory, 'connections', `${connectionId}.json`),
    JSON.stringify({ connectionId, type: connectionType, properties })
  );
}

function dataSet(snapshotSpec) {
  return { name: 'staging-sample', snapshotSpec };
}

const uri = { _secret: 'MONGODB_URI', '~k': 'k1' };

test('resolvePullConnections applies per-connection overrides over the snapshot defaults and reads only listed connections', async () => {
  writeConnection('tickets', { databaseUri: uri, collection: 'tickets' });
  writeConnection('frameworks', { databaseUri: uri, collection: 'frameworks' });
  writeConnection('folders', { databaseUri: uri, collection: 'folders', databaseName: 'app' });
  writeConnection('unlisted', { databaseUri: uri, collection: 'unlisted' });
  const connections = await resolvePullConnections({
    buildDirectory,
    dataSet: dataSet({
      from: 'staging',
      connections: [
        'tickets',
        { id: 'frameworks', scope: false, limit: 20000 },
        { id: 'folders', sort: { created_at: -1 }, omit: ['auth.encrypted'] },
      ],
      scope: { field: 'organizationId', values: ['org_b'] },
      limit: 100,
    }),
  });
  expect(connections).toEqual([
    {
      connectionId: 'tickets',
      collection: 'tickets',
      databaseName: undefined,
      secretName: 'MONGODB_URI',
      scope: { field: 'organizationId', values: ['org_b'] },
      limit: 100,
      sort: { _id: -1 },
      omit: [],
    },
    {
      connectionId: 'frameworks',
      collection: 'frameworks',
      databaseName: undefined,
      secretName: 'MONGODB_URI',
      scope: null,
      limit: 20000,
      sort: { _id: -1 },
      omit: [],
    },
    {
      connectionId: 'folders',
      collection: 'folders',
      databaseName: 'app',
      secretName: 'MONGODB_URI',
      scope: { field: 'organizationId', values: ['org_b'] },
      limit: 100,
      sort: { created_at: -1 },
      omit: ['auth.encrypted'],
    },
  ]);
});

test('resolvePullConnections defaults the limit to 5000', async () => {
  writeConnection('tickets', { databaseUri: uri, collection: 'tickets' });
  const [connection] = await resolvePullConnections({
    buildDirectory,
    dataSet: dataSet({ from: 'staging', connections: ['tickets'] }),
  });
  expect(connection.limit).toEqual(5000);
  expect(connection.scope).toBe(null);
});

test('resolvePullConnections refuses a literal databaseUri', async () => {
  writeConnection('tickets', { databaseUri: 'mongodb://localhost/app', collection: 'tickets' });
  await expect(
    resolvePullConnections({
      buildDirectory,
      dataSet: dataSet({ from: 'staging', connections: ['tickets'] }),
    })
  ).rejects.toThrow(
    'Data set "staging-sample" connection "tickets": a pull reads only connections whose databaseUri is { _secret: NAME }'
  );
});

test('resolvePullConnections refuses a databaseUri computed by another operator', async () => {
  writeConnection('tickets', { databaseUri: { _env: 'MONGODB_URI' }, collection: 'tickets' });
  await expect(
    resolvePullConnections({
      buildDirectory,
      dataSet: dataSet({ from: 'staging', connections: ['tickets'] }),
    })
  ).rejects.toThrow('a pull reads only connections whose databaseUri is { _secret: NAME }');
});

test('resolvePullConnections refuses a non-MongoDB connection', async () => {
  writeConnection('api', { baseURL: 'https://example.com' }, 'AxiosHttp');
  await expect(
    resolvePullConnections({
      buildDirectory,
      dataSet: dataSet({ from: 'staging', connections: ['api'] }),
    })
  ).rejects.toThrow('connection "api" is a AxiosHttp connection');
});

test('resolvePullConnections refuses two listed connections naming one collection in different databases', async () => {
  writeConnection('tickets', { databaseUri: uri, collection: 'tickets' });
  writeConnection('reporting', {
    databaseUri: { _secret: 'REPORTING_URI' },
    collection: 'tickets',
  });
  await expect(
    resolvePullConnections({
      buildDirectory,
      dataSet: dataSet({ from: 'staging', connections: ['tickets', 'reporting'] }),
    })
  ).rejects.toThrow(
    'connections "tickets" and "reporting" both name collection "tickets" in different databases'
  );
});
