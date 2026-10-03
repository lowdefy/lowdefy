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

import { jest } from '@jest/globals';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { BSON, MongoClient } from 'mongodb';
import { hashDataSetSpec } from '@lowdefy/node-utils';

const execFileAsync = promisify(execFile);

jest.setTimeout(120000);

const sourceDatabase = 'pull_source';
const entry = path.join(process.cwd(), 'lib', 'data', 'pullDataSet.mjs');

let client;
let configDirectory;

const lowdefyYaml = `lowdefy: local
name: Pull Test
config:
  environment: prod
  environments:
    staging:
      guards:
        secrets:
          MONGODB_URI: '127\\.0\\.0\\.1'
    prod:
      guards:
        secrets:
          MONGODB_URI: 'acme-prod\\.example\\.net'
        env:
          BETTER_AUTH_URL: '^https://app\\.example\\.com$'
    local: {}
connections:
${['tickets', 'companies', 'frameworks', 'connections', 'users']
  .map(
    (id) => `  - id: ${id}
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      databaseName: ${sourceDatabase}
      collection: ${id}`
  )
  .join('\n')}
  - id: literal
    type: MongoDBCollection
    properties:
      databaseUri: mongodb://127.0.0.1:1/never
      collection: tickets
`;

const snapshotYaml = `snapshot:
  from: staging
  connections:
    - tickets
    - companies
    - { id: frameworks, scope: false, limit: 2 }
    - { id: connections, sort: { created_at: 1 }, limit: 2, omit: [auth.encrypted] }
  scope:
    field: organizationId
    values: [org_b, org_c]
fixtures:
  tickets:
    - { _id: t-fixture, organizationId: org_a }
users:
  owner: { id: u_1, organizationId: org_a }
`;

function writeDataSet(name, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', `${name}.yaml`), content);
}

function readLines(name, collection) {
  const content = fs.readFileSync(
    path.join(configDirectory, '.lowdefy', 'data', name, `${collection}.jsonl`),
    'utf8'
  );
  return content
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => BSON.EJSON.parse(line));
}

function readManifest(name) {
  return JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'data', name, 'manifest.json'), 'utf8')
  );
}

// Runs the entry the CLI spawns, in its own Node process, with only the variables a shell would
// pass. Resolves { code, output } and never throws on a refusal.
async function pull(name, secrets = { LOWDEFY_SECRET_MONGODB_URI: process.env.MONGO_URL }) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('LOWDEFY_'))
  );
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [entry, name], {
      env: { ...env, ...secrets, LOWDEFY_DIRECTORY_CONFIG: configDirectory },
    });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    return { code: error.code, output: `${error.stdout}${error.stderr}` };
  }
}

beforeAll(async () => {
  client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  const db = client.db(sourceDatabase);
  await db.dropDatabase();
  const orgs = ['org_a', 'org_b', 'org_c'];
  await db.collection('tickets').insertMany(
    Array.from({ length: 9 }, (_, index) => ({
      _id: `t${index}`,
      organizationId: orgs[index % 3],
      number: index,
      created: new Date(Date.UTC(2026, 0, index + 1)),
    }))
  );
  await db
    .collection('tickets')
    .createIndex({ organizationId: 1, number: 1 }, { unique: true, name: 'org_number' });
  await db.collection('tickets').createIndex({ created: 1 }, { expireAfterSeconds: 3600 });
  await db.collection('companies').insertMany([
    { _id: 'c1', name: 'Acme' },
    { _id: 'c2', name: 'Globex' },
  ]);
  await db.collection('companies').createIndex({ name: 'text' }, { weights: { name: 5 } });
  await db.collection('frameworks').insertMany([
    { _id: 'f1', organizationId: 'org_a' },
    { _id: 'f2', organizationId: 'org_a' },
    { _id: 'f3', organizationId: 'org_b' },
  ]);
  await db.collection('connections').insertMany([
    { _id: 'k1', created_at: 3, auth: { provider: 'drive', encrypted: 'sealed-1' } },
    { _id: 'k2', created_at: 1, auth: { provider: 'drive', encrypted: 'sealed-2' } },
    { _id: 'k3', created_at: 2, auth: { provider: 'drive', encrypted: 'sealed-3' } },
  ]);
  await db.collection('users').insertMany([{ _id: 'u1', email: 'a@example.test' }]);
});

afterAll(async () => {
  await client.db(sourceDatabase).dropDatabase();
  await client.close();
});

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-pull-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'lowdefy.yaml'), lowdefyYaml);
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('pullDataSet copies exactly the listed connections with scope, limit, sort and omit applied', async () => {
  writeDataSet('staging-sample', snapshotYaml);
  // config.environment names prod, whose guards this shell does not satisfy: the pull builds as
  // staging and checks only the secrets it reads.
  const { code, output } = await pull('staging-sample');
  expect(output).toMatch(
    'Pulled data set \\"staging-sample\\" from staging: 12 documents in 4 collections'
  );
  expect(code).toEqual(0);

  const tickets = readLines('staging-sample', 'tickets');
  expect(tickets.map((ticket) => ticket._id)).toEqual(['t8', 't7', 't5', 't4', 't2', 't1']);
  expect(tickets[0].created).toEqual(new Date(Date.UTC(2026, 0, 9)));

  // No organizationId field: the scope does not apply.
  expect(readLines('staging-sample', 'companies').map((company) => company._id)).toEqual([
    'c2',
    'c1',
  ]);
  // scope: false and limit: 2, sorted by _id descending.
  expect(readLines('staging-sample', 'frameworks').map((framework) => framework._id)).toEqual([
    'f3',
    'f2',
  ]);
  // sort and omit: the sealed field never leaves the database.
  expect(readLines('staging-sample', 'connections')).toEqual([
    { _id: 'k2', created_at: 1, auth: { provider: 'drive' } },
    { _id: 'k3', created_at: 2, auth: { provider: 'drive' } },
  ]);
  // Unlisted connections are not read.
  expect(
    fs.existsSync(path.join(configDirectory, '.lowdefy', 'data', 'staging-sample', 'users.jsonl'))
  ).toBe(false);

  const manifest = readManifest('staging-sample');
  expect(manifest.name).toEqual('staging-sample');
  expect(manifest.from).toEqual('staging');
  expect(Date.parse(manifest.pulledAt)).toBeGreaterThan(Date.now() - 120000);
  expect(manifest.specHash).toEqual(
    hashDataSetSpec({
      snapshotSpec: {
        from: 'staging',
        connections: [
          'tickets',
          'companies',
          { id: 'frameworks', scope: false, limit: 2 },
          { id: 'connections', sort: { created_at: 1 }, limit: 2, omit: ['auth.encrypted'] },
        ],
        scope: { field: 'organizationId', values: ['org_b', 'org_c'] },
      },
    })
  );
  expect(manifest.sourceHash).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(manifest)).not.toMatch('127.0.0.1');
  expect(Object.keys(manifest.collections).sort()).toEqual([
    'companies',
    'connections',
    'frameworks',
    'tickets',
  ]);
  expect(manifest.collections.tickets.connections).toEqual(['tickets']);
  expect(manifest.collections.tickets.count).toEqual(6);

  // Indexes are recorded without _id_, v or ns, with every other option kept.
  const ticketIndexes = manifest.collections.tickets.indexes;
  expect(ticketIndexes.map((index) => index.name).sort()).toEqual(['created_1', 'org_number']);
  expect(ticketIndexes.find((index) => index.name === 'org_number')).toEqual({
    key: { organizationId: 1, number: 1 },
    name: 'org_number',
    unique: true,
  });
  expect(ticketIndexes.find((index) => index.name === 'created_1').expireAfterSeconds).toEqual(
    3600
  );
  const [textIndex] = manifest.collections.companies.indexes;
  expect(textIndex.key).toEqual({ _fts: 'text', _ftsx: 1 });
  expect(textIndex.weights).toEqual({ name: 5 });
  expect(textIndex.v).toBeUndefined();
  expect(textIndex.ns).toBeUndefined();

  // The pull's build is its own, beside the snapshots.
  expect(
    fs.existsSync(
      path.join(configDirectory, '.lowdefy', 'data', '.build', 'build', 'environmentGuards.json')
    )
  ).toBe(true);
});

test('pullDataSet refuses a secret that is not the from environment database, never printing it', async () => {
  writeDataSet('staging-sample', snapshotYaml);
  const { code, output } = await pull('staging-sample', {
    LOWDEFY_SECRET_MONGODB_URI: 'mongodb+srv://u:hunter2@acme-prod.example.net/app',
  });
  expect(code).toEqual(1);
  expect(output).toMatch(
    `Secret \\"MONGODB_URI\\" does not match environment \\"staging\\"'s guard`
  );
  expect(output).not.toMatch('hunter2');
  expect(output).not.toMatch('acme-prod.example.net/app');
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'data', 'staging-sample'))).toBe(
    false
  );
});

test('pullDataSet refuses a literal databaseUri', async () => {
  writeDataSet('literal', 'snapshot:\n  from: staging\n  connections: [literal]\n');
  const { code, output } = await pull('literal');
  expect(code).toEqual(1);
  expect(output).toMatch('a pull reads only connections whose databaseUri is { _secret: NAME }');
});

test('pullDataSet refuses an undeclared from', async () => {
  writeDataSet('qa-sample', 'snapshot:\n  from: qa\n  connections: [tickets]\n');
  const { code, output } = await pull('qa-sample');
  expect(code).toEqual(1);
  expect(output).toMatch('qa');
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'data', 'qa-sample'))).toBe(false);
});

test('pullDataSet refuses a data set with no snapshot block', async () => {
  writeDataSet('empty-org', 'users:\n  owner: { id: u_1 }\n');
  const { code, output } = await pull('empty-org');
  expect(code).toEqual(1);
  expect(output).toMatch('has no snapshot block, so there is nothing to pull.');
});

test('pullDataSet leaves the previous snapshot in place when a pull fails mid-read', async () => {
  writeDataSet('staging-sample', snapshotYaml);
  expect((await pull('staging-sample')).code).toEqual(0);
  const before = readManifest('staging-sample');

  // The second connection's sort is refused by the server after the first collection is read.
  writeDataSet(
    'staging-sample',
    `snapshot:
  from: staging
  connections:
    - companies
    - { id: frameworks, sort: { _id: sideways } }
`
  );
  expect((await pull('staging-sample')).code).toEqual(1);
  expect(readManifest('staging-sample')).toEqual(before);
  expect(readLines('staging-sample', 'tickets')).toHaveLength(6);
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'data', 'staging-sample.tmp'))).toBe(
    false
  );
});
