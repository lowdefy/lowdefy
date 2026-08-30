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

import validateTenantSharedLookup from './validateTenantSharedLookup.js';

const tenantConnections = new Map([
  ['org_scope', { type: 'MongoDBCollection', field: 'organization_id' }],
]);
const tenantCollectionMap = {
  controls: { shared: [], scoped: ['org_scope'] },
  catalogue: { shared: ['frameworks'], scoped: [] },
  regions: { shared: ['regions_a', 'regions_b'], scoped: [] },
};
const location = 'Request "search" at page "home"';

function run(options) {
  const { pipeline, tenant, connectionId = 'org_scope' } = options;
  const hasIds = 'ids' in options;
  return () =>
    validateTenantSharedLookup({
      config: { connectionId, tenant, properties: { pipeline } },
      location,
      tenantConnections: hasIds ? options.ids : tenantConnections,
      tenantCollectionMap,
      configKey: 'k1',
    });
}

const sharedLookup = {
  $lookup: { from: 'catalogue', localField: 'a', foreignField: 'b', as: 'c' },
};

test('$lookup.from on a shared collection throws with the full message and check slug', () => {
  let error;
  try {
    run({ pipeline: [{ $match: { status: 'active' } }, sharedLookup] })();
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  expect(error.message).toBe(
    'Request "search" at page "home" uses "$lookup" on collection "catalogue" over tenant connection "org_scope". Collection "catalogue" belongs to connection "frameworks", which is declared tenant: shared, so it carries no tenant field. The wall prepends a tenant $match into every $lookup/$unionWith sub-pipeline, so this stage will match nothing and the join returns []. Run the pipeline on "frameworks" and pass the organization facts in through the request payload, or declare tenant: authored on this request and author the organization clause yourself.'
  );
  expect(error.checkSlug).toBe('tenant-lookup');
  expect(error.configKey).toBe('k1');
});

test('$unionWith string form on a shared collection throws', () => {
  expect(run({ pipeline: [{ $unionWith: 'catalogue' }] })).toThrow(
    'uses "$unionWith" on collection "catalogue" over tenant connection "org_scope"'
  );
});

test('$unionWith.coll on a shared collection throws', () => {
  expect(run({ pipeline: [{ $unionWith: { coll: 'catalogue', pipeline: [] } }] })).toThrow(
    'uses "$unionWith" on collection "catalogue"'
  );
});

test('$graphLookup.from on a shared collection throws', () => {
  expect(
    run({
      pipeline: [
        {
          $graphLookup: {
            from: 'catalogue',
            startWith: '$x',
            connectFromField: 'x',
            connectToField: 'y',
            as: 'z',
          },
        },
      ],
    })
  ).toThrow('uses "$graphLookup" on collection "catalogue"');
});

test('a $lookup nested inside a $lookup.pipeline on a shared collection throws', () => {
  expect(
    run({
      pipeline: [
        {
          $lookup: {
            from: 'controls',
            as: 'c',
            pipeline: [{ $match: { a: 1 } }, sharedLookup],
          },
        },
      ],
    })
  ).toThrow('uses "$lookup" on collection "catalogue"');
});

test('a $lookup nested inside a $unionWith.pipeline on a shared collection throws', () => {
  expect(
    run({ pipeline: [{ $unionWith: { coll: 'controls', pipeline: [sharedLookup] } }] })
  ).toThrow('uses "$lookup" on collection "catalogue"');
});

test('a $lookup inside a $facet branch on a shared collection throws', () => {
  expect(
    run({ pipeline: [{ $facet: { counts: [{ $count: 'n' }], joined: [sharedLookup] } }] })
  ).toThrow('uses "$lookup" on collection "catalogue"');
});

test('lists every other shared connection declaring the collection', () => {
  expect(run({ pipeline: [{ $lookup: { from: 'regions', as: 'r' } }] })).toThrow(
    'belongs to connection "regions_a" (also declared on: regions_b), which is declared tenant: shared'
  );
});

test('a $lookup onto a scoped collection passes', () => {
  expect(run({ pipeline: [{ $lookup: { from: 'controls', as: 'c' } }] })).not.toThrow();
});

test('a $lookup onto a collection no connection declares passes', () => {
  expect(run({ pipeline: [{ $lookup: { from: 'unknown', as: 'c' } }] })).not.toThrow();
});

test('an operator-valued $lookup.from passes', () => {
  expect(run({ pipeline: [{ $lookup: { from: { _payload: 'coll' }, as: 'c' } }] })).not.toThrow();
});

test('non-object stages and non-array sub-pipelines are skipped', () => {
  expect(
    run({
      pipeline: [
        { _if: { test: true, then: sharedLookup, else: null } },
        'stage',
        null,
        { $lookup: { from: 'controls', as: 'c', pipeline: { _payload: 'p' } } },
        { $unionWith: 42 },
        { $facet: { a: { _payload: 'branch' } } },
      ],
    })
  ).not.toThrow();
});

test('tenant: none skips the check', () => {
  expect(run({ pipeline: [sharedLookup], tenant: 'none' })).not.toThrow();
});

test('tenant: authored still throws on a shared $lookup, with the authored fix', () => {
  expect(run({ pipeline: [sharedLookup], tenant: 'authored' })).toThrow(
    'Move this stage onto "frameworks" and pass the organization facts in through the request payload — "tenant: authored" exempts only entry stages and $graphLookup, not $lookup sub-pipelines.'
  );
  expect(run({ pipeline: [sharedLookup], tenant: 'authored' })).not.toThrow(
    'or declare tenant: authored on this request'
  );
});

test('a request on a connection outside the wall passes', () => {
  expect(run({ pipeline: [sharedLookup], connectionId: 'frameworks' })).not.toThrow();
});

test('nothing runs when the policy is not tenant (no tenant connection ids)', () => {
  expect(run({ pipeline: [sharedLookup], ids: undefined })).not.toThrow();
  expect(run({ pipeline: [sharedLookup], ids: new Map() })).not.toThrow();
});

test('a pipeline that is not a literal array passes', () => {
  expect(run({ pipeline: { _payload: 'pipeline' } })).not.toThrow();
  expect(run({ pipeline: undefined })).not.toThrow();
});
