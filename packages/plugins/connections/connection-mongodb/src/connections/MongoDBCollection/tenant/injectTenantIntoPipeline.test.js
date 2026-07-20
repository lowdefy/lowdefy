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

test('a $unionWith pipeline that starts with $search is rewritten at its entry', () => {
  expect(
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
  ).toEqual([
    tenantMatch,
    {
      $unionWith: {
        coll: 'other',
        pipeline: [
          {
            $search: {
              compound: { must: [{ text: { query: 'q', path: 'name' } }], filter: [equalsClause] },
            },
          },
          tenantMatch,
        ],
      },
    },
  ]);
});

test('$graphLookup without restrictSearchWithMatch gains the tenant equality', () => {
  expect(
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
  ).toEqual([
    tenantMatch,
    {
      $graphLookup: {
        from: 'other',
        startWith: '$a',
        connectFromField: 'a',
        connectToField: 'b',
        as: 'j',
        restrictSearchWithMatch: { organizationId: 'org_a' },
      },
    },
  ]);
});

test('$graphLookup with restrictSearchWithMatch merges with $and', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $graphLookup: { from: 'other', restrictSearchWithMatch: { status: 'open' } } }],
      tenant,
    })
  ).toEqual([
    tenantMatch,
    {
      $graphLookup: {
        from: 'other',
        restrictSearchWithMatch: { $and: [{ status: 'open' }, { organizationId: 'org_a' }] },
      },
    },
  ]);
});

test('$graphLookup with an authored tenant field in restrictSearchWithMatch throws', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        { $graphLookup: { from: 'other', restrictSearchWithMatch: { organizationId: 'org_b' } } },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be set in restrictSearchWithMatch');
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

test('a stage-0 bare operator $search is wrapped in compound with a tenant filter', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $search: {
            index: 'default',
            text: { query: 'q', path: 'name' },
            count: { type: 'total' },
            highlight: { path: 'name' },
            returnStoredSource: true,
            sort: { score: { $meta: 'searchScore' } },
          },
        },
        { $limit: 10 },
      ],
      tenant,
    })
  ).toEqual([
    {
      $search: {
        index: 'default',
        count: { type: 'total' },
        highlight: { path: 'name' },
        returnStoredSource: true,
        sort: { score: { $meta: 'searchScore' } },
        compound: { must: [{ text: { query: 'q', path: 'name' } }], filter: [equalsClause] },
      },
    },
    tenantMatch,
    { $limit: 10 },
  ]);
});

test('a stage-0 $search with a compound filter array appends the tenant clause', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $search: {
            compound: {
              must: [{ text: { query: 'q', path: 'name' } }],
              filter: [{ range: { path: 'age', gte: 18 } }],
            },
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    {
      $search: {
        compound: {
          must: [{ text: { query: 'q', path: 'name' } }],
          filter: [{ range: { path: 'age', gte: 18 } }, equalsClause],
        },
      },
    },
    tenantMatch,
  ]);
});

test('a stage-0 $search with a single object compound filter becomes an array', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $search: {
            compound: {
              must: [{ text: { query: 'q', path: 'name' } }],
              filter: { range: { path: 'age', gte: 18 } },
            },
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    {
      $search: {
        compound: {
          must: [{ text: { query: 'q', path: 'name' } }],
          filter: [{ range: { path: 'age', gte: 18 } }, equalsClause],
        },
      },
    },
    tenantMatch,
  ]);
});

test('a stage-0 $search compound without a filter gains one', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $search: { compound: { must: [{ text: { query: 'q', path: 'name' } }] } } }],
      tenant,
    })
  ).toEqual([
    {
      $search: {
        compound: { must: [{ text: { query: 'q', path: 'name' } }], filter: [equalsClause] },
      },
    },
    tenantMatch,
  ]);
});

test('a stage-0 $searchMeta is rewritten without a trailing $match', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $searchMeta: { index: 'default', count: { type: 'total' } } }],
      tenant,
    })
  ).toEqual([
    {
      $searchMeta: {
        index: 'default',
        count: { type: 'total' },
        compound: { filter: [equalsClause] },
      },
    },
  ]);
});

test('throws when a $search path uses the tenant field', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { text: { query: 'org_b', path: 'organizationId' } } }],
      tenant,
    })
  ).toThrow(
    'Tenant field "organizationId" can not be used as a $search path on a tenant connection - the tenant wall injects the organization filter mechanically.'
  );
});

test('throws when a $search path array includes the tenant field', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { text: { query: 'q', path: ['name', 'organizationId'] } } }],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be used as a $search path');
});

test('throws when a $search path uses a dotted tenant field path', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [{ $search: { text: { query: 'q', path: 'organizationId.x' } } }],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be used as a $search path');
});

test('throws when a nested $search compound clause paths the tenant field', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $search: {
            compound: { filter: [{ equals: { path: 'organizationId', value: 'org_b' } }] },
          },
        },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be used as a $search path');
});

test('allows a $search path that only shares the tenant field prefix', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [{ $search: { text: { query: 'q', path: 'organizationIdentifier' } } }],
      tenant,
    })
  ).toEqual([
    {
      $search: {
        compound: {
          must: [{ text: { query: 'q', path: 'organizationIdentifier' } }],
          filter: [equalsClause],
        },
      },
    },
    tenantMatch,
  ]);
});

test('a stage-0 $vectorSearch without a filter gains the tenant filter and a trailing $match', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: [0.1, 0.2],
            numCandidates: 100,
            limit: 10,
          },
        },
        { $project: { name: 1 } },
      ],
      tenant,
    })
  ).toEqual([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: [0.1, 0.2],
        numCandidates: 100,
        limit: 10,
        filter: { organizationId: { $eq: 'org_a' } },
      },
    },
    tenantMatch,
    { $project: { name: 1 } },
  ]);
});

test('a stage-0 $vectorSearch with an existing filter merges with $and', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: [0.1],
            limit: 5,
            filter: { status: { $eq: 'open' } },
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: [0.1],
        limit: 5,
        filter: { $and: [{ status: { $eq: 'open' } }, { organizationId: { $eq: 'org_a' } }] },
      },
    },
    tenantMatch,
  ]);
});

test('throws when a $vectorSearch filter authors the tenant field', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: [0.1],
            limit: 5,
            filter: { organizationId: { $eq: 'org_b' } },
          },
        },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a $vectorSearch filter');
});

test('a stage-0 $geoNear without a query gains the tenant query', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [1, 2] },
            distanceField: 'distance',
          },
        },
        { $limit: 10 },
      ],
      tenant,
    })
  ).toEqual([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [1, 2] },
        distanceField: 'distance',
        query: { organizationId: 'org_a' },
      },
    },
    { $limit: 10 },
  ]);
});

test('a stage-0 $geoNear with a query merges with $and', () => {
  expect(
    injectTenantIntoPipeline({
      pipeline: [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [1, 2] },
            distanceField: 'distance',
            query: { status: 'open' },
          },
        },
      ],
      tenant,
    })
  ).toEqual([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [1, 2] },
        distanceField: 'distance',
        query: { $and: [{ status: 'open' }, { organizationId: 'org_a' }] },
      },
    },
  ]);
});

test('throws when a $geoNear query authors the tenant field', () => {
  expect(() =>
    injectTenantIntoPipeline({
      pipeline: [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [1, 2] },
            distanceField: 'distance',
            query: { organizationId: 'org_b' },
          },
        },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a $geoNear query');
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
