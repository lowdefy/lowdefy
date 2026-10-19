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
  const filePath = path.join(buildDirectory, 'connections', `${connectionId}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({ connectionId, '~k': `k_${connectionId}`, ...artifact })
  );
}

function mongo(properties) {
  return {
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI', '~k': 'k' }, ...properties },
  };
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

test('readDataSet reads module connections, which the build writes under their module folder', async () => {
  writeConnection('contacts/contacts', mongo({ collection: 'contacts' }));
  writeConnection('crm-contacts', mongo({ collection: 'contacts', databaseName: 'crm' }));
  writeDataSet('alpha', 'fixtures:\n  contacts/contacts: [{ _id: c1 }]\n');
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha": Connections "contacts/contacts" and "crm-contacts" both name collection "contacts" in different databases'
  );
});

test('readDataSet maps a module connection to its collection', async () => {
  writeConnection('contacts/contacts', mongo({ collection: 'contacts' }));
  writeDataSet('alpha', 'fixtures:\n  contacts/contacts: [{ _id: c1 }]\n');
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'alpha' });
  expect(dataSet.collections).toEqual({ 'contacts/contacts': 'contacts' });
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

test('readDataSet refuses an indexed connection whose databaseName is an operator', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets', databaseName: { _env: 'DB' } }));
  writeDataSet('alpha', 'indexes:\n  tickets:\n    - { key: { number: 1 } }\n');
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

test('readDataSet resolves generated connections and refuses one the app does not have', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeDataSet(
    'alpha',
    'generate:\n  seed: 1\n  tickets:\n    count: 2\n  invoices:\n    count: 1\n'
  );
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" connection "invoices" is not a connection in this app.'
  );
  writeDataSet('beta', 'generate:\n  seed: 1\n  tickets:\n    count: 2\n');
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'beta' });
  expect(dataSet.collections).toEqual({ tickets: 'tickets' });
  expect(dataSet.generated.tickets.map(({ _id }) => _id)).toEqual(['tickets-1', 'tickets-2']);
});

test('readDataSet passes the size advice of a large data set on as a warning', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeDataSet('big', 'generate:\n  seed: 1\n  tickets:\n    count: 1200\n');
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'big' });
  expect(dataSet.warnings).toEqual([
    'Data set "big" loads 1,200 documents for connection "tickets". More than 1,000 per collection is not advised: every journey on it loads slower, and journeys target fixture values, not volume.',
  ]);
});

test('readDataSet refuses a fixture on another connection of the same collection sharing a generated _id', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeConnection('tickets-archive', mongo({ collection: 'tickets' }));
  writeDataSet(
    'alpha',
    'fixtures:\n  tickets-archive: [{ _id: tickets-2 }]\ngenerate:\n  seed: 1\n  tickets:\n    count: 2\n'
  );
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" generate.tickets[1] _id "tickets-2" is also the _id of fixture tickets-archive[0]; connections "tickets" and "tickets-archive" both load collection "tickets".'
  );
});

test('readDataSet refuses two connections of the same collection generating one _id', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeConnection('tickets-archive', mongo({ collection: 'tickets' }));
  writeDataSet(
    'alpha',
    'generate:\n  seed: 1\n  tickets:\n    count: 1\n    fields:\n      _id: { sequence: { prefix: t-, start: 1 } }\n  tickets-archive:\n    count: 1\n    fields:\n      _id: { sequence: { prefix: t-, start: 1 } }\n'
  );
  await expect(readDataSet({ configDirectory, buildDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set "alpha" generate.tickets-archive[0] _id "t-1" is also the _id of generate.tickets[0]; connections "tickets-archive" and "tickets" both load collection "tickets".'
  );
});

test('readDataSet accepts the same _id on connections of different collections', async () => {
  writeConnection('tickets', mongo({ collection: 'tickets' }));
  writeConnection('invoices', mongo({ collection: 'invoices' }));
  writeDataSet(
    'alpha',
    'fixtures:\n  invoices: [{ _id: tickets-1 }]\ngenerate:\n  seed: 1\n  tickets:\n    count: 1\n'
  );
  const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'alpha' });
  expect(dataSet.generated.tickets.map(({ _id }) => _id)).toEqual(['tickets-1']);
});
