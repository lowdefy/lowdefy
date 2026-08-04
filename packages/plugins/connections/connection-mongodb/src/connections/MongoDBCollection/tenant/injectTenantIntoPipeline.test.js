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

import injectTenantIntoPipeline from './injectTenantIntoPipeline.js';

const tenant = { field: 'organizationId', value: 'org_a' };
const authoredTenant = { field: 'organizationId', value: 'org_a', authored: true };
const tenantMatch = { $match: { organizationId: 'org_a' } };
const equalsClause = { equals: { path: 'organizationId', value: 'org_a' } };

test('prepends the tenant $match to an empty pipeline', () => {
  expect(injectTenantIntoPipeline({ pipeline: [], tenant })).toEqual([tenantMatch]);
  expect(injectTenantIntoPipeline({ pipeline: undefined, tenant })).toEqual([tenantMatch]);
});

test('prepends the tenant $match to an authored pipeline', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $match: { status: 'open' } }, { $sort: { _id: 1 } }],
      tenant,
    })
  ).toEqual([tenantMatch, { $match: { status: 'open' } }, { $sort: { _id: 1 } }]);
});

test('does not mutate the authored pipeline', () => {
  const pipeline = [{ $lookup: { from: 'other', localField: 'a', foreignField: 'b', as: 'j' } }];
  injectTenantIntoPipeline({ pipeline, tenant });
  expect(pipeline).toEqual([
    { $lookup: { from: 'other', localField: 'a', foreignField: 'b', as: 'j' } },
  ]);
});

test('throws when the tenant field is authored in a $match', () => {
  expect(() =>
    injectTenantIntoPipeline({ pipeline: [{ $match: { organizationId: 'org_b' } }], tenant })
  ).toThrow(
    'Tenant field "organizationId" can not be set in a $match stage on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('throws when the tenant field is authored nested in a later $match', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        { $match: { status: 'open' } },
        { $match: { $and: [{ a: 1 }, { 'organizationId.x': 1 }] } },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a $match stage');
});

test('throws on $out', () => {
  expect(() =>
    injectTenantIntoPipeline({ pipeline: [{ $match: { a: 1 } }, { $out: 'other' }], tenant })
  ).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$out" or "$merge" - they write whole collections outside the tenant stamp path.'
  );
});

test('throws on $merge', () => {
  expect(() =>
    injectTenantIntoPipeline({ pipeline: [{ $merge: { into: 'other' } }], tenant })
  ).toThrow('Aggregation pipelines on a tenant connection can not contain "$out" or "$merge"');
});

test('throws on $out nested in a $lookup pipeline', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $lookup: { from: 'other', as: 'j', pipeline: [{ $out: 'other' }] } }],
      tenant,
    })
  ).toThrow('Aggregation pipelines on a tenant connection can not contain "$out" or "$merge"');
});

test('localField/foreignField $lookup gains a tenant pipeline', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $lookup: { from: 'other', localField: 'a', foreignField: 'b', as: 'j' } }],
      tenant,
    })
  ).toEqual([
    tenantMatch,
    {
      $lookup: {
        from: 'other',
        localField: 'a',
        foreignField: 'b',
        as: 'j',
        pipeline: [tenantMatch],
      },
    },
  ]);
});

test('pipeline form $lookup gets entry injection into its pipeline', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $lookup: {
            from: 'other',
            let: { id: '$_id' },
            as: 'j',
            pipeline: [{ $match: { $expr: { $eq: ['$ref', '$$id'] } } }],
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    tenantMatch,
    {
      $lookup: {
        from: 'other',
        let: { id: '$_id' },
        as: 'j',
        pipeline: [tenantMatch, { $match: { $expr: { $eq: ['$ref', '$$id'] } } }],
      },
    },
  ]);
});

test('a $lookup nested inside a $lookup pipeline is injected recursively', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $lookup: {
            from: 'other',
            as: 'j',
            pipeline: [{ $lookup: { from: 'third', as: 'k', pipeline: [{ $limit: 1 }] } }],
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    tenantMatch,
    {
      $lookup: {
        from: 'other',
        as: 'j',
        pipeline: [
          tenantMatch,
          {
            $lookup: {
              from: 'third',
              as: 'k',
              pipeline: [tenantMatch, { $limit: 1 }],
            },
          },
        ],
      },
    },
  ]);
});

test('string form $unionWith is rewritten to coll and pipeline', () => {
  expect(injectTenantIntoPipeline({ pipeline: [{ $unionWith: 'other' }], tenant })).toEqual([
    tenantMatch,
    { $unionWith: { coll: 'other', pipeline: [tenantMatch] } },
  ]);
});

test('object form $unionWith gets entry injection into its pipeline', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $unionWith: { coll: 'other', pipeline: [{ $match: { a: 1 } }] } }],
      tenant,
    })
  ).toEqual([
    tenantMatch,
    { $unionWith: { coll: 'other', pipeline: [tenantMatch, { $match: { a: 1 } }] } },
  ]);
});

test('object form $unionWith without a pipeline gains one', () => {
  expect(
    injectTenantIntoPipeline({ pipeline: [{ $unionWith: { coll: 'other' } }], tenant })
  ).toEqual([tenantMatch, { $unionWith: { coll: 'other', pipeline: [tenantMatch] } }]);
});

test('$facet branches are recursed without entry injection', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $facet: {
            counts: [{ $count: 'total' }],
            joined: [{ $lookup: { from: 'other', localField: 'a', foreignField: 'b', as: 'j' } }],
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    tenantMatch,
    {
      $facet: {
        counts: [{ $count: 'total' }],
        joined: [
          {
            $lookup: {
              from: 'other',
              localField: 'a',
              foreignField: 'b',
              as: 'j',
              pipeline: [tenantMatch],
            },
          },
        ],
      },
    },
  ]);
});

test('throws on $collStats', () => {
  expect(() =>
    injectTenantIntoPipeline({ pipeline: [{ $collStats: { count: {} } }], tenant })
  ).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$collStats" or "$indexStats" - collection-level statistics can not be tenant-scoped.'
  );
});

test('throws on $indexStats', () => {
  expect(() => injectTenantIntoPipeline({ pipeline: [{ $indexStats: {} }], tenant })).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$collStats" or "$indexStats"'
  );
});

test('passes a non-object stage through for the driver to reject', () => {
  expect(injectTenantIntoPipeline({ pipeline: ['not-a-stage'], tenant })).toEqual([
    tenantMatch,
    'not-a-stage',
  ]);
});

test('passes a malformed $unionWith through for the driver to reject', () => {
  expect(injectTenantIntoPipeline({ pipeline: [{ $unionWith: 42 }], tenant })).toEqual([
    tenantMatch,
    { $unionWith: 42 },
  ]);
});

test('uses the custom tenant field name', () => {
  const customTenant = { field: 'tenantId', value: 't_1' };
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $match: { organizationId: 'kept' } }],
      tenant: customTenant,
    })
  ).toEqual([{ $match: { tenantId: 't_1' } }, { $match: { organizationId: 'kept' } }]);
  expect(() =>
    injectTenantIntoPipeline({ pipeline: [{ $match: { tenantId: 't_2' } }], tenant: customTenant })
  ).toThrow('Tenant field "tenantId" can not be set in a $match stage');
});

// ─────────────────────────────────────────────────────────────────────────────
// Refusal: stages the wall can not scope mechanically (amendment-1)
// ─────────────────────────────────────────────────────────────────────────────

test.each(['$search', '$searchMeta'])('refuses a %s entry stage without authored', (stageKey) => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ [stageKey]: { text: { query: 'q', path: 'name' } } }],
      tenant,
    })
  ).toThrow(
    `Aggregation pipelines on a tenant connection can not contain "${stageKey}" unless the request declares "tenant: authored"`
  );
});

test('refuses a $vectorSearch entry stage without authored', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $vectorSearch: { index: 'v', queryVector: [0.1], path: 'e', limit: 5 } }],
      tenant,
    })
  ).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$vectorSearch" unless the request declares "tenant: authored"'
  );
});

test('refuses a $geoNear entry stage without authored', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        { $geoNear: { near: { type: 'Point', coordinates: [0, 0] }, distanceField: 'd' } },
      ],
      tenant,
    })
  ).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$geoNear" unless the request declares "tenant: authored"'
  );
});

test('refuses $graphLookup without authored', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $graphLookup: {
            from: 'other',
            startWith: '$a',
            connectFromField: 'a',
            connectToField: 'b',
            as: 'j',
          },
        },
      ],
      tenant,
    })
  ).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$graphLookup" unless the request declares "tenant: authored"'
  );
});

test('refuses a $search entry inside a $unionWith sub-pipeline without authored', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $unionWith: {
            coll: 'other',
            pipeline: [{ $search: { text: { query: 'q', path: 'name' } } }],
          },
        },
      ],
      tenant,
    })
  ).toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$search" unless the request declares "tenant: authored"'
  );
});

test('the refusal error carries the fix snippet', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { text: { query: 'q', path: 'name' } } }],
      tenant,
    })
  ).toThrow('_user: organizationId');
});

// ─────────────────────────────────────────────────────────────────────────────
// Authored: the audit accepts a correct clause and never rewrites the stage
// ─────────────────────────────────────────────────────────────────────────────

test('authored $search with the org equals in compound.filter passes untouched, no trailing $match', () => {
  const search = {
    $search: {
      returnStoredSource: true,
      compound: {
        filter: [{ compound: { must: [{ text: { query: 'q', path: 'name' } }] } }, equalsClause],
      },
    },
  };
  expect(
    injectTenantIntoPipeline({
      pipeline: [search, { $limit: 10 }],
      tenant: authoredTenant,
    })
  ).toEqual([search, { $limit: 10 }]);
});

test('authored $searchMeta with the org equals passes untouched', () => {
  const searchMeta = {
    $searchMeta: {
      compound: { filter: [equalsClause], must: [{ text: { query: 'q', path: 'n' } }] },
    },
  };
  expect(injectTenantIntoPipeline({ pipeline: [searchMeta], tenant: authoredTenant })).toEqual([
    searchMeta,
  ]);
});

test('authored $search still gets mechanical injection at later $lookup entries', () => {
  const search = { $search: { compound: { filter: [equalsClause] } } };
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        search,
        { $lookup: { from: 'other', localField: 'a', foreignField: 'b', as: 'j' } },
      ],
      tenant: authoredTenant,
    })
  ).toEqual([
    search,
    {
      $lookup: {
        from: 'other',
        localField: 'a',
        foreignField: 'b',
        as: 'j',
        pipeline: [tenantMatch],
      },
    },
  ]);
});

test('authored $search audit fails when the equals clause is missing', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { compound: { must: [{ text: { query: 'q', path: 'n' } }] } } }],
      tenant: authoredTenant,
    })
  ).toThrow(
    'Request declares "tenant: authored", but its "$search" stage has no "compound.filter" equals clause on tenant field "organizationId"'
  );
});

test('authored $search audit fails on a wrong value', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $search: {
            compound: { filter: [{ equals: { path: 'organizationId', value: 'org_b' } }] },
          },
        },
      ],
      tenant: authoredTenant,
    })
  ).toThrow('has no "compound.filter" equals clause on tenant field "organizationId"');
});

test('authored $search audit fails on a wrong path', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        { $search: { compound: { filter: [{ equals: { path: 'orgId', value: 'org_a' } }] } } },
      ],
      tenant: authoredTenant,
    })
  ).toThrow('has no "compound.filter" equals clause on tenant field "organizationId"');
});

test('authored $search audit fails when the clause sits outside compound.filter', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { compound: { should: [equalsClause] } } }],
      tenant: authoredTenant,
    })
  ).toThrow('has no "compound.filter" equals clause');
});

test('authored $vectorSearch with the org equality in filter passes untouched, no trailing $match', () => {
  const vectorSearch = {
    $vectorSearch: {
      index: 'v',
      queryVector: [0.1],
      path: 'e',
      limit: 5,
      filter: { $and: [{ status: 'open' }, { organizationId: { $eq: 'org_a' } }] },
    },
  };
  expect(injectTenantIntoPipeline({ pipeline: [vectorSearch], tenant: authoredTenant })).toEqual([
    vectorSearch,
  ]);
});

test('authored $vectorSearch audit fails without the equality', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $vectorSearch: { index: 'v', queryVector: [0.1], path: 'e', limit: 5 } }],
      tenant: authoredTenant,
    })
  ).toThrow(
    'Request declares "tenant: authored", but its "$vectorSearch" stage has no "filter" equality on tenant field "organizationId"'
  );
});

test('an equality inside $or does not satisfy the audit', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $vectorSearch: {
            index: 'v',
            queryVector: [0.1],
            path: 'e',
            limit: 5,
            filter: { $or: [{ organizationId: 'org_a' }, { status: 'open' }] },
          },
        },
      ],
      tenant: authoredTenant,
    })
  ).toThrow('has no "filter" equality on tenant field "organizationId"');
});

test('authored $geoNear with the org equality in query passes untouched', () => {
  const geoNear = {
    $geoNear: {
      near: { type: 'Point', coordinates: [0, 0] },
      distanceField: 'd',
      query: { organizationId: 'org_a' },
    },
  };
  expect(injectTenantIntoPipeline({ pipeline: [geoNear], tenant: authoredTenant })).toEqual([
    geoNear,
  ]);
});

test('authored $geoNear audit fails without the equality', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        { $geoNear: { near: { type: 'Point', coordinates: [0, 0] }, distanceField: 'd' } },
      ],
      tenant: authoredTenant,
    })
  ).toThrow(
    'Request declares "tenant: authored", but its "$geoNear" stage has no "query" equality on tenant field "organizationId"'
  );
});

test('authored $graphLookup with the org equality in restrictSearchWithMatch passes untouched', () => {
  const graphLookup = {
    $graphLookup: {
      from: 'other',
      startWith: '$a',
      connectFromField: 'a',
      connectToField: 'b',
      as: 'j',
      restrictSearchWithMatch: { organizationId: 'org_a' },
    },
  };
  expect(injectTenantIntoPipeline({ pipeline: [graphLookup], tenant: authoredTenant })).toEqual([
    tenantMatch,
    graphLookup,
  ]);
});

test('authored $graphLookup audit fails without the equality', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $graphLookup: {
            from: 'other',
            startWith: '$a',
            connectFromField: 'a',
            connectToField: 'b',
            as: 'j',
            restrictSearchWithMatch: { status: 'open' },
          },
        },
      ],
      tenant: authoredTenant,
    })
  ).toThrow(
    'Request declares "tenant: authored", but its "$graphLookup" stage has no "restrictSearchWithMatch" equality on tenant field "organizationId"'
  );
});

test('authored with nothing to author is refused', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $match: { status: 'open' } }],
      tenant: authoredTenant,
    })
  ).toThrow(
    'Request declares "tenant: authored" but its pipeline contains no stage that requires an authored tenant clause'
  );
});

test('authored audit uses the custom tenant field name', () => {
  const customAuthored = { field: 'tenantId', value: 't_1', authored: true };
  const search = {
    $search: { compound: { filter: [{ equals: { path: 'tenantId', value: 't_1' } }] } },
  };
  expect(injectTenantIntoPipeline({ pipeline: [search], tenant: customAuthored })).toEqual([
    search,
  ]);
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { compound: { filter: [equalsClause] } } }],
      tenant: customAuthored,
    })
  ).toThrow('has no "compound.filter" equals clause on tenant field "tenantId"');
});
