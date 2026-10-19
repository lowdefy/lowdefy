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

import resolveJourneyDataSet from './resolveJourneyDataSet.js';

let configDirectory;
let buildDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-resolve-journey-data-set-'));
  buildDirectory = path.join(configDirectory, '.lowdefy', 'dev', 'build');
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  fs.mkdirSync(path.join(buildDirectory, 'connections'), { recursive: true });
  fs.writeFileSync(
    path.join(buildDirectory, 'connections', 'tickets.json'),
    JSON.stringify({
      connectionId: 'tickets',
      type: 'MongoDBCollection',
      properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'tickets' },
    })
  );
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'data', 'empty-org.yaml'),
    `fixtures:
  tickets: [{ _id: t1, organizationId: org_a }]
users:
  owner: { id: u_1, roles: [admin], organizationId: org_a }
  member: { id: u_2, roles: [member], organizationId: org_a }
`
  );
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function resolve(overrides) {
  return resolveJourneyDataSet({
    configDirectory,
    buildDirectory,
    authConfigured: true,
    mockUserActive: false,
    ...overrides,
  });
}

test('resolveJourneyDataSet resolves a named user from the data set', async () => {
  const { dataSet, user, error } = await resolve({ data: 'empty-org', user: 'member' });
  expect(error).toBeUndefined();
  expect(user).toEqual({ id: 'u_2', roles: ['member'], organizationId: 'org_a' });
  expect(dataSet.name).toEqual('empty-org');
  expect(dataSet.collections).toEqual({ tickets: 'tickets' });
});

test('resolveJourneyDataSet keeps an inline user on a data set journey', async () => {
  const { user, dataSet } = await resolve({ data: 'empty-org', user: { id: 'x', roles: [] } });
  expect(user).toEqual({ id: 'x', roles: [] });
  expect(dataSet.users.owner.id).toEqual('u_1');
});

test('resolveJourneyDataSet refuses a user name the data set does not declare', async () => {
  const { error } = await resolve({ data: 'empty-org', user: 'outsider' });
  expect(error).toEqual(
    'Data set "empty-org" declares no user "outsider". Declared: owner, member.'
  );
});

test('resolveJourneyDataSet refuses a user name on a journey with no data', async () => {
  const { error } = await resolve({ user: 'member' });
  expect(error).toMatch(
    'The journey\'s user "member" names a data set user, but the journey has no "data".'
  );
});

test('resolveJourneyDataSet passes a journey with no data and no named user through untouched', async () => {
  expect(await resolve({ user: 'none' })).toEqual({ user: 'none' });
  expect(await resolve({ user: { roles: ['admin'] } })).toEqual({ user: { roles: ['admin'] } });
});

test('resolveJourneyDataSet refuses user none on a data set while auth is configured', async () => {
  const { error } = await resolve({ data: 'empty-org', user: 'none' });
  expect(error).toMatch('has user "none", which is refused while auth is configured');
});

test('resolveJourneyDataSet allows user none on a data set when auth is not configured', async () => {
  const { error, user } = await resolve({ data: 'empty-org', user: 'none', authConfigured: false });
  expect(error).toBeUndefined();
  expect(user).toEqual('none');
});

test.each([['member'], [{ id: 'x', roles: ['admin'] }], [undefined]])(
  'resolveJourneyDataSet refuses a data set journey with user %j while a dev mock user is active',
  async (user) => {
    const { error } = await resolve({ data: 'empty-org', user, mockUserActive: true });
    expect(error).toMatch('cannot run while a dev mock user is active');
  }
);

test('resolveJourneyDataSet returns readDataSet errors as its own', async () => {
  const { error } = await resolve({ data: 'missing', user: 'member' });
  expect(error).toEqual('Data set "missing" not found in tests/data. Declared: empty-org.');
});

test('resolveJourneyDataSet refuses user none while a dev mock user is active', async () => {
  const { error } = await resolve({ user: 'none', mockUserActive: true });
  expect(error).toMatch(
    'The journey has user "none", which cannot run while a dev mock user is active'
  );
});

test('resolveJourneyDataSet keeps user none when no dev mock user is active', async () => {
  expect(await resolve({ user: 'none' })).toEqual({ user: 'none' });
});
