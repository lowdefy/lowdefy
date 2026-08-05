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

import tenantPreflight from './tenantPreflight.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';

function makeConnection(collection) {
  return { databaseUri, databaseName, collection };
}

test('tenantPreflight detects a document missing the tenant field', async () => {
  const collection = 'tenantPreflightMissingField';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'stamped', organizationId: 'org_a' }, { _id: 'unstamped' }],
  });
  const res = await tenantPreflight({
    connection: makeConnection(collection),
    field: 'organizationId',
  });
  expect(res).toEqual({ ok: false });
});

test('tenantPreflight detects an explicit null tenant field', async () => {
  const collection = 'tenantPreflightExplicitNull';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'stamped', organizationId: 'org_a' },
      { _id: 'null-stamped', organizationId: null },
    ],
  });
  const res = await tenantPreflight({
    connection: makeConnection(collection),
    field: 'organizationId',
  });
  expect(res).toEqual({ ok: false });
});

test('tenantPreflight passes a fully stamped collection', async () => {
  const collection = 'tenantPreflightStamped';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a' },
      { _id: 'b1', organizationId: 'org_b' },
    ],
  });
  const res = await tenantPreflight({
    connection: makeConnection(collection),
    field: 'organizationId',
  });
  expect(res).toEqual({ ok: true });
});

test('tenantPreflight passes an empty collection', async () => {
  const res = await tenantPreflight({
    connection: makeConnection('tenantPreflightEmptyCollection'),
    field: 'organizationId',
  });
  expect(res).toEqual({ ok: true });
});

test('tenantPreflight probes a custom tenant field', async () => {
  const collection = 'tenantPreflightCustomField';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'a1', organization_id: 'org_a' }, { _id: 'unstamped' }],
  });
  const res = await tenantPreflight({
    connection: makeConnection(collection),
    field: 'organization_id',
  });
  expect(res).toEqual({ ok: false });
});

test('tenantPreflight ignores other collections', async () => {
  await populateTestMongoDb({
    collection: 'tenantPreflightOtherCollection',
    documents: [{ _id: 'unstamped' }],
  });
  const res = await tenantPreflight({
    connection: makeConnection('tenantPreflightCleanCollection'),
    field: 'organizationId',
  });
  expect(res).toEqual({ ok: true });
});
