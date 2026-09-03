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

import validateTenantPipeline from './validateTenantPipeline.js';

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
  return validateTenantPipeline({
    config: { connectionId, tenant, properties: { pipeline } },
    location,
    tenantConnections: hasIds ? options.ids : tenantConnections,
    tenantCollectionMap,
    configKey: 'k1',
  });
}

function messages(options) {
  return run(options).map((error) => error.message);
}

const sharedLookup = {
  $lookup: { from: 'catalogue', localField: 'a', foreignField: 'b', as: 'c' },
};

const graphLookup = {
  $graphLookup: {
    from: 'catalogue',
    startWith: '$x',
    connectFromField: 'x',
    connectToField: 'y',
    as: 'z',
  },
};

test('$lookup.from on a shared collection reports the full message and check slug', () => {
  const errors = run({ pipeline: [{ $match: { status: 'active' } }, sharedLookup] });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toBe(
    'Request "search" at page "home" uses "$lookup" on collection "catalogue" over tenant connection "org_scope". Collection "catalogue" belongs to connection "frameworks", which is declared tenant: shared, so it carries no tenant field. The wall prepends a tenant $match into every $lookup/$unionWith sub-pipeline, so this stage will match nothing and the join returns []. Run the pipeline on "frameworks" and pass the organization facts in through the request payload, or declare tenant: authored on this request and author the organization clause yourself.'
  );
  expect(errors[0].checkSlug).toBe('tenant-lookup');
  expect(errors[0].configKey).toBe('k1');
});

test('$unionWith string form on a shared collection is reported', () => {
  expect(messages({ pipeline: [{ $unionWith: 'catalogue' }] })).toEqual([
    expect.stringContaining('uses "$unionWith" on collection "catalogue"'),
  ]);
});

test('$unionWith.coll on a shared collection is reported', () => {
  expect(messages({ pipeline: [{ $unionWith: { coll: 'catalogue', pipeline: [] } }] })).toEqual([
    expect.stringContaining('uses "$unionWith" on collection "catalogue"'),
  ]);
});

test('$graphLookup on a shared collection names the audited restrictSearchWithMatch, not an injected $match', () => {
  const found = messages({ pipeline: [graphLookup], tenant: 'authored' });
  expect(found).toHaveLength(1);
  expect(found[0]).toContain('uses "$graphLookup" on collection "catalogue"');
  expect(found[0]).toContain(
    'The wall audits the "restrictSearchWithMatch" clause you author on it against the caller\'s organization, and that clause filters on a field collection "catalogue" does not carry, so the traversal returns nothing.'
  );
  expect(found[0]).not.toContain('prepends a tenant $match');
});

test('a $lookup nested inside a $lookup.pipeline on a shared collection is reported', () => {
  expect(
    messages({
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
  ).toEqual([expect.stringContaining('uses "$lookup" on collection "catalogue"')]);
});

test('a $lookup nested inside a $unionWith.pipeline on a shared collection is reported', () => {
  expect(
    messages({ pipeline: [{ $unionWith: { coll: 'controls', pipeline: [sharedLookup] } }] })
  ).toEqual([expect.stringContaining('uses "$lookup" on collection "catalogue"')]);
});

test('a $lookup inside a $facet branch on a shared collection is reported', () => {
  expect(
    messages({ pipeline: [{ $facet: { counts: [{ $count: 'n' }], joined: [sharedLookup] } }] })
  ).toEqual([expect.stringContaining('uses "$lookup" on collection "catalogue"')]);
});

test('lists every other shared connection declaring the collection', () => {
  expect(messages({ pipeline: [{ $lookup: { from: 'regions', as: 'r' } }] })).toEqual([
    expect.stringContaining(
      'belongs to connection "regions_a" (also declared on: regions_b), which is declared tenant: shared'
    ),
  ]);
});

test('a $lookup onto a scoped collection passes', () => {
  expect(run({ pipeline: [{ $lookup: { from: 'controls', as: 'c' } }] })).toEqual([]);
});

test('a $lookup onto a collection no connection declares passes', () => {
  expect(run({ pipeline: [{ $lookup: { from: 'unknown', as: 'c' } }] })).toEqual([]);
});

test('an operator-valued $lookup.from passes', () => {
  expect(run({ pipeline: [{ $lookup: { from: { _payload: 'coll' }, as: 'c' } }] })).toEqual([]);
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
  ).toEqual([]);
});

test('tenant: none skips the check', () => {
  expect(run({ pipeline: [sharedLookup], tenant: 'none' })).toEqual([]);
});

test('tenant: authored still reports a shared $lookup, with the authored fix', () => {
  expect(messages({ pipeline: [sharedLookup], tenant: 'authored' })).toEqual([
    expect.stringContaining(
      'Move this stage onto "frameworks" and pass the organization facts in through the request payload — "tenant: authored" exempts only entry stages and $graphLookup, not $lookup sub-pipelines.'
    ),
  ]);
  expect(messages({ pipeline: [sharedLookup], tenant: 'authored' })[0]).not.toContain(
    'or declare tenant: authored on this request'
  );
});

test('a request on a connection outside the wall passes', () => {
  expect(run({ pipeline: [sharedLookup], connectionId: 'frameworks' })).toEqual([]);
});

test('nothing runs when the policy is not tenant (no tenant connection ids)', () => {
  expect(run({ pipeline: [sharedLookup], ids: undefined })).toEqual([]);
  expect(run({ pipeline: [sharedLookup], ids: new Map() })).toEqual([]);
});

test('a pipeline that is not a literal array passes', () => {
  expect(run({ pipeline: { _payload: 'pipeline' } })).toEqual([]);
  expect(run({ pipeline: undefined })).toEqual([]);
});

test('a collection declared tenant: shared in collections: alone makes the $lookup an error', () => {
  const errors = validateTenantPipeline({
    config: { connectionId: 'org_scope', properties: { pipeline: [sharedLookup] } },
    location,
    tenantConnections,
    tenantCollectionMap: {},
    collections: { catalogue: { tenant: 'shared', connections: [] } },
    configKey: 'k1',
  });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toBe(
    'Request "search" at page "home" uses "$lookup" on collection "catalogue" over tenant connection "org_scope". Collection "catalogue" is declared tenant: shared in collections:, so it carries no tenant field. The wall prepends a tenant $match into every $lookup/$unionWith sub-pipeline, so this stage will match nothing and the join returns []. Run the pipeline on a tenant: shared connection for it and pass the organization facts in through the request payload, or declare tenant: authored on this request and author the organization clause yourself.'
  );
  expect(errors[0].checkSlug).toBe('tenant-lookup');
});

test('collections: naming the shared connection points the fix at it', () => {
  const errors = validateTenantPipeline({
    config: { connectionId: 'org_scope', properties: { pipeline: [sharedLookup] } },
    location,
    tenantConnections,
    tenantCollectionMap: {},
    collections: {
      catalogue: {
        tenant: 'shared',
        connections: [{ connectionId: 'frameworks', read: true, write: true, tenant: 'shared' }],
      },
    },
    configKey: 'k1',
  });
  expect(errors[0].message).toContain(
    'belongs to connection "frameworks", so it carries no tenant field'
  );
});

test('a collection declared with a tenant field is authoritative over a shared connection', () => {
  expect(
    validateTenantPipeline({
      config: { connectionId: 'org_scope', properties: { pipeline: [sharedLookup] } },
      location,
      tenantConnections,
      tenantCollectionMap,
      collections: { catalogue: { tenant: { field: 'organization_id' }, connections: [] } },
      configKey: 'k1',
    })
  ).toEqual([]);
});

test('an undeclared collection falls back to the connection-derived map', () => {
  expect(messages({ pipeline: [sharedLookup] })).toEqual([
    expect.stringContaining('belongs to connection "frameworks", which is declared tenant: shared'),
  ]);
});

test('an entry stage at the root without tenant: authored is reported', () => {
  expect(messages({ pipeline: [{ $search: { text: 'a' } }, { $limit: 5 }] })).toEqual([
    expect.stringContaining(
      'Request "search" at page "home" contains "$search" in its pipeline on tenant connection "org_scope", which the tenant wall does not scope mechanically.'
    ),
  ]);
});

test('an entry stage anywhere but the entry of its pipeline passes', () => {
  expect(run({ pipeline: [{ $limit: 5 }, { $geoNear: { near: [0, 0] } }] })).toEqual([]);
});

test('an entry stage at the entry of a sub-pipeline is reported', () => {
  expect(
    messages({
      pipeline: [
        {
          $lookup: {
            from: 'controls',
            as: 'c',
            pipeline: [{ $vectorSearch: { queryVector: [1] } }],
          },
        },
      ],
    })
  ).toEqual([expect.stringContaining('contains "$vectorSearch" in a "$lookup" sub-pipeline')]);
});

test('an entry stage with tenant: authored passes', () => {
  expect(run({ pipeline: [{ $search: { text: 'a' } }], tenant: 'authored' })).toEqual([]);
});

test('$graphLookup without tenant: authored is reported at the top level', () => {
  const found = messages({
    pipeline: [{ $graphLookup: { from: 'controls', as: 'z' } }],
  });
  expect(found).toEqual([
    expect.stringContaining('contains "$graphLookup" in its pipeline on tenant connection'),
  ]);
});

test('$graphLookup nested in a $facet branch without tenant: authored is reported', () => {
  const found = messages({
    pipeline: [{ $facet: { tree: [{ $graphLookup: { from: 'controls', as: 'z' } }] } }],
  });
  expect(found).toEqual([
    expect.stringContaining('contains "$graphLookup" in its pipeline ($facet branch "tree")'),
  ]);
});

test('$graphLookup nested in a $lookup sub-pipeline without tenant: authored is reported', () => {
  expect(
    messages({
      pipeline: [
        {
          $lookup: {
            from: 'controls',
            as: 'c',
            pipeline: [{ $graphLookup: { from: 'controls', as: 'z' } }],
          },
        },
      ],
    })
  ).toEqual([expect.stringContaining('contains "$graphLookup" in a "$lookup" sub-pipeline')]);
});

test('$out and $merge are reported on a walled pipeline, authored or not', () => {
  expect(messages({ pipeline: [{ $out: 'copies' }] })).toEqual([
    expect.stringContaining(
      'contains "$out" in its pipeline on tenant connection "org_scope". "$out" and "$merge" write whole collections outside the tenant stamp path, so the request is refused at runtime.'
    ),
  ]);
  expect(messages({ pipeline: [{ $merge: { into: 'copies' } }], tenant: 'authored' })).toEqual([
    expect.stringContaining('contains "$merge" in its pipeline'),
  ]);
});

test('$collStats and $indexStats are reported at any depth', () => {
  expect(
    messages({
      pipeline: [{ $facet: { stats: [{ $collStats: {} }] } }, { $indexStats: {} }],
    })
  ).toEqual([
    expect.stringContaining(
      'contains "$collStats" in its pipeline ($facet branch "stats") on tenant connection "org_scope". collection-level statistics can not be tenant-scoped'
    ),
    expect.stringContaining('contains "$indexStats" in its pipeline'),
  ]);
});

test('one walk reports every finding in a pipeline', () => {
  const found = messages({ pipeline: [sharedLookup, { $out: 'copies' }, graphLookup] });
  expect(found).toHaveLength(4);
});
