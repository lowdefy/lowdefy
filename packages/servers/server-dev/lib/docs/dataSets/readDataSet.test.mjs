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

import { hashDataSetSpec } from '@lowdefy/node-utils';

import readDataSet from './readDataSet.js';

let configDirectory;
let buildDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-read-data-set-'));
  buildDirectory = path.join(configDirectory, '.lowdefy', 'dev', 'build');
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  fs.mkdirSync(path.join(buildDirectory, 'connections'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeDataSet(name, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', `${name}.yaml`), content);
}

function writeConnection(connectionId, artifact) {
  fs.writeFileSync(
    path.join(buildDirectory, 'connections', `${connectionId}.json`),
    JSON.stringify({ connectionId, '~k': `k_${connectionId}`, ...artifact })
  );
}

function mongo(properties) {
  return {
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI', '~k': 'k' }, ...properties },
  };
}

function writeManifest(name, manifest) {
  const directory = path.join(configDirectory, '.lowdefy', 'data', name);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
}

test('readDataSet maps each keyed connection to its collection', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeConnection('tickets-archive', mongo({ collection: 'tickets' }));
  writeConnection('organizations', mongo({ collection: 'orgs', databaseName: 'app' }));
  writeConnection('api', { type: 'AxiosHttp', properties: { baseURL: 'https://example.com' } });
  writeDataSet(
    'fixtures-only',
    `fixtures:
  tickets: [{ _id: t1 }]
  tickets-archive: [{ _id: t2 }]
indexes:
  organizations: [{ key: { name: 1 } }]
users:
  owner: { id: u_1 }
`
  );
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'fixtures-only' });
  expect(dataSet.collections).toEqual({
    tickets: 'tickets',
    'tickets-archive': 'tickets',
    organizations: 'orgs',
  });
  expect(dataSet.warnings).toEqual([]);
  expect(dataSet.users).toEqual({ owner: { id: 'u_1' } });
});

test('readDataSet refuses a fixture keyed by a non-MongoDB connection', async () => {
  writeConnection('api', { type: 'AxiosHttp', properties: { baseURL: 'https://example.com' } });
  writeDataSet('alpha', 'fixtures:\n  api: [{ _id: a }]\n');
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" connection "api" is a AxiosHttp connection; data sets load MongoDBCollection connections only.'
  );
});

test('readDataSet refuses a key that is not a connection', async () => {
  writeDataSet('alpha', 'fixtures:\n  missing: [{ _id: a }]\n');
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" connection "missing" is not a connection in this app.'
  );
});

test('readDataSet refuses an index keyed by a connection whose collection is an operator', async () => {
  writeConnection('tickets', mongo({ collection: { _user: 'organizationId' } }));
  writeDataSet('alpha', 'indexes:\n  tickets: [{ key: { a: 1 } }]\n');
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" connection "tickets" has a computed "collection"'
  );
});

test('readDataSet refuses a snapshot connection whose databaseName is an operator', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets', databaseName: { _env: 'DB' } }));
  writeDataSet('alpha', 'snapshot:\n  from: staging\n  connections: [{ id: tickets }]\n');
  writeManifest('alpha', { pulledAt: '2026-10-01T00:00:00.000Z', specHash: 'x' });
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" connection "tickets" has a computed "databaseName"'
  );
});

test('readDataSet refuses a keyed connection naming one collection under a different databaseName from another connection', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets', databaseName: 'app' }));
  writeConnection('legacy-tickets', mongo({ collection: 'tickets', databaseName: 'legacy' }));
  writeDataSet('alpha', 'fixtures:\n  tickets: [{ _id: a }]\n');
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha": Connections "legacy-tickets" and "tickets" both name collection "tickets" in different databases'
  );
});

test('readDataSet refuses a keyed connection naming one collection under a different databaseUri secret from another connection', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeConnection('reporting', {
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'REPORTING_URI' }, collection: 'tickets' },
  });
  writeDataSet('alpha', 'fixtures:\n  tickets: [{ _id: a }]\n');
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Connections "reporting" and "tickets" both name collection "tickets" in different databases'
  );
});

test('readDataSet warns on the same collision between two unkeyed connections', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeConnection('a', mongo({ collection: 'events', databaseName: 'one' }));
  writeConnection('b', mongo({ collection: 'events', databaseName: 'two' }));
  writeConnection('computed', mongo({ collection: { _state: 'c' }, databaseName: 'three' }));
  writeDataSet('alpha', 'fixtures:\n  tickets: [{ _id: a }]\n');
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'alpha' });
  expect(dataSet.warnings).toEqual([
    'Connections "a" and "b" both name collection "events" in different databases; under a data set they read one database, so they share one collection.',
  ]);
});

test('readDataSet refuses a snapshot block with no pull, naming the pull command', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeDataSet('staging-sample', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  await expect(
    readDataSet({ configDirectory, buildDirectory, name: 'staging-sample' })
  ).rejects.toThrow(
    `Data set "staging-sample" has a snapshot block but no snapshot. Run: lowdefy data pull staging-sample (with the staging environment's secrets).`
  );
});

test('readDataSet warns when the snapshot block changed since the pull', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeDataSet('staging-sample', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  writeManifest('staging-sample', {
    pulledAt: '2026-10-01T00:00:00.000Z',
    specHash: hashDataSetSpec({ snapshotSpec: { from: 'staging', connections: ['other'] } }),
  });
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'staging-sample' });
  expect(dataSet.collections).toEqual({ tickets: 'tickets' });
  expect(dataSet.warnings).toEqual([
    'Data set "staging-sample" snapshot block changed since the last pull. Run: lowdefy data pull staging-sample',
  ]);
});

test('readDataSet does not warn when the snapshot block matches the pull', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeDataSet('staging-sample', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  writeManifest('staging-sample', {
    pulledAt: '2026-10-01T00:00:00.000Z',
    specHash: hashDataSetSpec({ snapshotSpec: { from: 'staging', connections: ['tickets'] } }),
  });
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'staging-sample' });
  expect(dataSet.warnings).toEqual([]);
  expect(dataSet.snapshot.pulledAt).toEqual('2026-10-01T00:00:00.000Z');
});
