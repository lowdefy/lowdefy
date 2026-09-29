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

import { ObjectId } from 'mongodb';
import { validate } from '@lowdefy/ajv';

import MongoDBTableQuery from './MongoDBTableQuery.js';
import compileTableQuery from './compileTableQuery.js';
import getTestCollection from '../../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBTableQuery.meta;
const schema = MongoDBTableQuery.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'tableQuery';
const connection = { databaseUri, databaseName, collection, read: true };

const stages = ['lead', 'won', 'lost'];
const owners = ['Ada', 'Grace', null];
const ownerIds = [
  new ObjectId('64b000000000000000000001'),
  new ObjectId('64b000000000000000000002'),
];

// 30 org_1 deals: stage cycles lead/won/lost, owner cycles Ada/Grace/none, amount is
// i % 5 * 100 so many rows tie on amount. 5 org_2 deals must never be returned.
const documents = [
  ...Array.from({ length: 30 }, (_, index) => ({
    _id: `d${String(index).padStart(2, '0')}`,
    org_id: 'org_1',
    name: index === 7 ? 'Ada Lovelace (a.k.a. Countess)' : `Deal ${index}`,
    stage: stages[index % 3],
    owner: owners[index % 3] === null ? undefined : { name: owners[index % 3] },
    owner_id: ownerIds[index % 2],
    amount: (index % 5) * 100,
    created: new Date(Date.UTC(2026, 0, 1 + index)),
    tags: index % 4 === 0 ? [] : ['vip', index % 2 === 0 ? 'new' : 'renewal'],
    note: [null, '', 'x'][index % 3],
    active: index % 2 === 0,
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    _id: `other${index}`,
    org_id: 'org_2',
    name: `Other ${index}`,
    stage: 'won',
    amount: 1000,
  })),
].map((doc) => {
  if (doc.owner === undefined) {
    const { owner, ...rest } = doc;
    return rest;
  }
  return doc;
});

const orgOneDocs = documents.filter((doc) => doc.org_id === 'org_1');

const fields = {
  org_id: { type: 'text' },
  name: { type: 'text', search: true, groupable: true },
  stage: { type: 'tag', groupable: true },
  owner: { type: 'text', path: 'owner.name', search: true, groupable: true },
  owner_id: { type: 'relation', groupable: true },
  amount: { type: 'currency' },
  created: { type: 'date' },
  tags: { type: 'tags' },
  note: { type: 'text' },
  active: { type: 'boolean' },
};

const pipeline = [{ $match: { org_id: 'org_1' } }];

function query(properties) {
  return MongoDBTableQuery({
    request: { pipeline, fields, ...properties },
    connection,
  });
}

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('checkRead should be true', () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', () => {
  expect(checkWrite).toBe(false);
});

describe('paging', () => {
  test('returns the requested block and the total of the base scope', async () => {
    const res = await query({ startRow: 0, endRow: 10 });
    expect(res.total).toBe(30);
    expect(res.rows.map((row) => row._id)).toEqual(orgOneDocs.slice(0, 10).map((doc) => doc._id));
    expect(res.groups).toBeUndefined();
    expect(res.aggregates).toBeUndefined();
  });

  test('blocks tile the result without gaps or repeats under a sort with ties', async () => {
    const view = { sort: [{ key: 'amount', desc: true }] };
    const blocks = await Promise.all(
      [0, 7, 14, 21, 28].map((startRow) => query({ view, startRow, endRow: startRow + 7 }))
    );
    const ids = blocks.flatMap((block) => block.rows.map((row) => row._id));
    const expected = [...orgOneDocs]
      .sort((a, b) => b.amount - a.amount || a._id.localeCompare(b._id))
      .map((doc) => doc._id);
    expect(ids).toEqual(expected);
    expect(new Set(ids).size).toBe(30);
    blocks.forEach((block) => expect(block.total).toBe(30));
  });

  test('a repeated request returns the same order', async () => {
    const view = { sort: [{ key: 'stage' }] };
    const first = await query({ view, startRow: 5, endRow: 15 });
    const second = await query({ view, startRow: 5, endRow: 15 });
    expect(second.rows.map((row) => row._id)).toEqual(first.rows.map((row) => row._id));
  });

  test('a block past the end returns no rows and the total', async () => {
    const res = await query({ startRow: 40, endRow: 50 });
    expect(res).toEqual({ rows: [], total: 30 });
  });

  test('a zero row request returns the total only', async () => {
    const res = await query({ startRow: 0, endRow: 0, view: { search: 'deal' } });
    expect(res).toEqual({ rows: [], total: 29 });
  });

  test('more rows than maxRows is refused', async () => {
    await expect(query({ startRow: 0, endRow: 51, maxRows: 50 })).rejects.toThrow(
      'MongoDBTableQuery requested 51 rows (startRow 0 to endRow 51), more than maxRows (50).'
    );
  });
});

describe('filter and search', () => {
  test('search matches escaped words across search fields', async () => {
    const res = await query({ view: { search: 'ada (a.k.a.' } });
    expect(res.rows.map((row) => row._id)).toEqual(['d07']);
    const owners = await query({ view: { search: 'grace' } });
    expect(owners.total).toBe(10);
  });

  test('empty matches null, missing, empty string and empty array', async () => {
    const note = await query({ view: { filter: { key: 'note', op: 'empty' } } });
    expect(note.total).toBe(20);
    const tags = await query({ view: { filter: { key: 'tags', op: 'empty' } } });
    expect(tags.total).toBe(8);
    const owner = await query({ view: { filter: { key: 'owner', op: 'empty' } } });
    expect(owner.total).toBe(10);
    const notEmpty = await query({ view: { filter: { key: 'note', op: 'notEmpty' } } });
    expect(notEmpty.total).toBe(10);
  });

  test('typed filters combine with and/or', async () => {
    const res = await query({
      view: {
        filter: {
          and: [
            { key: 'amount', op: 'between', value: ['100', 200] },
            {
              or: [
                { key: 'stage', op: 'eq', value: 'WON' },
                { key: 'created', op: 'before', value: '2026-01-05' },
              ],
            },
          ],
        },
      },
    });
    const expected = orgOneDocs
      .filter(
        (doc) =>
          doc.amount >= 100 &&
          doc.amount <= 200 &&
          (doc.stage === 'won' || doc.created < new Date('2026-01-05'))
      )
      .map((doc) => doc._id);
    expect(res.rows.map((row) => row._id)).toEqual(expected);
  });

  test('tags in, nin and contains', async () => {
    const renewal = await query({
      view: { filter: { key: 'tags', op: 'contains', value: 'Renewal' } },
    });
    expect(renewal.total).toBe(orgOneDocs.filter((doc) => doc.tags.includes('renewal')).length);
    const none = await query({ view: { filter: { key: 'tags', op: 'nin', value: ['vip'] } } });
    expect(none.total).toBe(8);
    const any = await query({ view: { filter: { key: 'tags', op: 'in', value: ['new', 'x'] } } });
    expect(any.total).toBe(orgOneDocs.filter((doc) => doc.tags.includes('new')).length);
    const notRenewal = await query({
      view: { filter: { key: 'tags', op: 'notContains', value: 'RENEWAL' } },
    });
    expect(notRenewal.total).toBe(orgOneDocs.filter((doc) => !doc.tags.includes('renewal')).length);
  });

  test('avatar fields filter with the text operators', async () => {
    const res = await query({
      fields: { ...fields, owner: { type: 'avatar', path: 'owner.name' } },
      view: { filter: { key: 'owner', op: 'startsWith', value: 'gr' } },
    });
    expect(res.total).toBe(10);
  });

  test('boolean and date eq filters', async () => {
    const inactive = await query({ view: { filter: { key: 'active', op: 'isFalse' } } });
    expect(inactive.total).toBe(15);
    const day = await query({
      view: { filter: { key: 'created', op: 'eq', value: '2026-01-03T18:00:00Z' } },
    });
    expect(day.rows.map((row) => row._id)).toEqual(['d02']);
  });

  test('relation filter by ObjectId returns serialized ids', async () => {
    const res = await query({
      view: { filter: { key: 'owner_id', op: 'eq', value: { _oid: ownerIds[1].toHexString() } } },
      endRow: 1,
    });
    expect(res.total).toBe(15);
    expect(res.rows[0].owner_id).toEqual({ _oid: ownerIds[1].toHexString() });
  });

  test('MongoDB accepts every compiled operator', async () => {
    const conditions = [
      [{ key: 'name', op: 'ne', value: 'deal 1' }, 29],
      [{ key: 'name', op: 'notContains', value: 'deal' }, 1],
      [{ key: 'name', op: 'startsWith', value: 'ADA' }, 1],
      [{ key: 'name', op: 'endsWith', value: '(a.k.a. countess)' }, 1],
      [{ key: 'stage', op: 'in', value: ['won', 'LOST'] }, 20],
      [{ key: 'stage', op: 'nin', value: ['won', 'LOST'] }, 10],
      [{ key: 'amount', op: 'lt', value: 200 }, 12],
      [{ key: 'amount', op: 'lte', value: 200 }, 18],
      [{ key: 'amount', op: 'gt', value: 200 }, 12],
      [{ key: 'amount', op: 'ne', value: 0 }, 24],
      [{ key: 'created', op: 'ne', value: '2026-01-01' }, 29],
      [{ key: 'created', op: 'after', value: '2026-01-29' }, 1],
      [{ key: 'created', op: 'between', value: ['2026-01-10', '2026-01-12'] }, 3],
      [{ key: 'created', op: 'within', value: { last: 100, unit: 'year' } }, 30],
      [{ key: 'created', op: 'within', value: { next: 1, unit: 'week' } }, 0],
      [{ key: 'active', op: 'isTrue' }, 15],
      [{ key: 'active', op: 'eq', value: false }, 15],
      [{ key: 'tags', op: 'notEmpty' }, 22],
    ];
    const results = await Promise.all(
      conditions.map(([filter]) => query({ view: { filter }, startRow: 0, endRow: 0 }))
    );
    expect(results.map((res) => res.total)).toEqual(conditions.map(([, total]) => total));
  });

  test('$user values resolve from the user property', async () => {
    const res = await query({
      user: { name: 'Grace' },
      view: { filter: { key: 'owner', op: 'eq', value: { $user: 'name' } } },
    });
    expect(res.total).toBe(10);
  });

  test('a filter can not widen past the base pipeline', async () => {
    const orgTwo = await query({
      view: { filter: { key: 'org_id', op: 'eq', value: 'org_2' } },
    });
    expect(orgTwo.total).toBe(0);
    const everything = await query({
      view: {
        filter: {
          or: [
            { key: 'org_id', op: 'notEmpty' },
            { key: 'org_id', op: 'empty' },
            { key: 'org_id', op: 'contains', value: '' },
          ],
        },
        search: 'other',
      },
    });
    expect(everything.total).toBe(0);
  });

  test('injection attempts are refused before the query runs', async () => {
    await expect(query({ view: { filter: { $where: 'true' } } })).rejects.toThrow(
      'MongoDBTableQuery filter condition has an unknown key "$where".'
    );
    await expect(
      query({ view: { filter: { key: 'org_id', op: 'ne', value: { $gt: '' } } } })
    ).rejects.toThrow(
      'MongoDBTableQuery filter on "org_id": operator "ne" expects a string or number for type "text". Received {"$gt":""}.'
    );
    await expect(
      query({ view: { filter: { key: 'secret', op: 'eq', value: 1 } } })
    ).rejects.toThrow('MongoDBTableQuery view filter key "secret" is not in the request "fields".');
    await expect(
      query({ view: { filter: { key: 'amount', op: 'contains', value: '1' } } })
    ).rejects.toThrow('operator "contains" is not allowed for type "currency".');
  });
});

describe('grouping', () => {
  const view = {
    group: [{ key: 'stage' }, { key: 'owner' }],
    aggregates: { amount: 'sum', name: 'countDistinct', note: 'percentEmpty' },
  };

  function expectedAggregates(docs) {
    return {
      amount: docs.reduce((sum, doc) => sum + doc.amount, 0),
      name: new Set(docs.map((doc) => doc.name)).size,
      note: docs.length === 0 ? 0 : docs.filter((doc) => !doc.note).length / docs.length,
    };
  }

  test('first level returns groups with counts and aggregates', async () => {
    const res = await query({ view, groupPath: [], startRow: 0, endRow: 100 });
    expect(res.rows).toEqual([]);
    expect(res.total).toBe(3);
    expect(res.groups).toEqual(
      ['lead', 'lost', 'won'].map((stage) => {
        const docs = orgOneDocs.filter((doc) => doc.stage === stage);
        return { key: stage, count: docs.length, aggregates: expectedAggregates(docs) };
      })
    );
    expect(res.aggregates).toEqual(expectedAggregates(orgOneDocs));
  });

  test('second level returns the groups inside the group path, missing values as null', async () => {
    const res = await query({ view, groupPath: ['won'], startRow: 0, endRow: 100 });
    const wonDocs = orgOneDocs.filter((doc) => doc.stage === 'won');
    const keys = [null, 'Ada', 'Grace'].filter((owner) =>
      wonDocs.some((doc) => (doc.owner?.name ?? null) === owner)
    );
    expect(res.groups.map((group) => group.key)).toEqual(keys);
    res.groups.forEach((group) => {
      const docs = wonDocs.filter((doc) => (doc.owner?.name ?? null) === group.key);
      expect(group.count).toBe(docs.length);
      expect(group.aggregates).toEqual(expectedAggregates(docs));
    });
    expect(res.total).toBe(keys.length);
    expect(res.aggregates).toEqual(expectedAggregates(wonDocs));
  });

  test('a full group path returns the leaf rows of the group', async () => {
    const res = await query({ view, groupPath: ['won', null], startRow: 0, endRow: 100 });
    const docs = orgOneDocs.filter((doc) => doc.stage === 'won' && doc.owner === undefined);
    expect(res.groups).toBeUndefined();
    expect(res.total).toBe(docs.length);
    expect(res.rows.map((row) => row._id)).toEqual(docs.map((doc) => doc._id));
  });

  test('groups page with startRow and endRow', async () => {
    const res = await query({ view, groupPath: [], startRow: 1, endRow: 2 });
    expect(res.total).toBe(3);
    expect(res.groups.map((group) => group.key)).toEqual(['lost']);
  });

  test('ObjectId group keys round trip through groupPath', async () => {
    const idView = { group: [{ key: 'owner_id' }] };
    const top = await query({ view: idView, groupPath: [] });
    expect(top.groups.map((group) => group.key)).toEqual(
      ownerIds.map((id) => ({ _oid: id.toHexString() }))
    );
    const leaf = await query({ view: idView, groupPath: [top.groups[1].key], endRow: 100 });
    expect(leaf.total).toBe(15);
  });

  test('groups respect the filter and base pipeline', async () => {
    const res = await query({
      view: { group: [{ key: 'stage' }], filter: { key: 'amount', op: 'gte', value: 0 } },
      groupPath: [],
    });
    expect(res.groups.reduce((sum, group) => sum + group.count, 0)).toBe(30);
  });
});

describe('aggregates', () => {
  test('whole-set aggregates over the filtered rows', async () => {
    const res = await query({
      view: {
        filter: { key: 'stage', op: 'eq', value: 'lead' },
        aggregates: {
          amount: 'avg',
          created: 'earliest',
          tags: 'countEmpty',
          owner: 'countNotEmpty',
          note: 'count',
        },
      },
      endRow: 1,
    });
    const docs = orgOneDocs.filter((doc) => doc.stage === 'lead');
    expect(res.aggregates).toEqual({
      amount: docs.reduce((sum, doc) => sum + doc.amount, 0) / docs.length,
      created: docs[0].created,
      tags: docs.filter((doc) => doc.tags.length === 0).length,
      owner: docs.filter((doc) => doc.owner !== undefined).length,
      note: docs.length,
    });
  });

  test('min, max and latest aggregates', async () => {
    const res = await query({
      view: { aggregates: { amount: 'max', created: 'latest' } },
      endRow: 1,
    });
    expect(res.aggregates).toEqual({ amount: 400, created: new Date(Date.UTC(2026, 0, 30)) });
  });

  test('countDistinct leaves out empty values', async () => {
    const res = await query({
      fields: {
        ...fields,
        note: { type: 'text', groupable: true },
        tags: { type: 'tags', groupable: true },
      },
      view: {
        aggregates: { note: 'countDistinct', owner: 'countDistinct', tags: 'countDistinct' },
      },
      endRow: 1,
    });
    // tags counts distinct arrays: [], ['vip', 'new'] and ['vip', 'renewal'], less the empty one.
    expect(res.aggregates).toEqual({ note: 1, owner: 2, tags: 2 });
  });

  test('countDistinct per group and over the whole set', async () => {
    const res = await query({
      view: { group: [{ key: 'stage' }], aggregates: { owner: 'countDistinct' } },
      groupPath: [],
    });
    expect(res.aggregates).toEqual({ owner: 2 });
    // Stage and owner cycle together: lead deals are Ada's, won deals Grace's, lost unowned.
    expect(res.groups.map((group) => [group.key, group.aggregates.owner])).toEqual([
      ['lead', 1],
      ['lost', 0],
      ['won', 1],
    ]);
  });

  test('aggregates of an empty result are zero or null', async () => {
    const res = await query({
      view: {
        filter: { key: 'stage', op: 'eq', value: 'nothing' },
        aggregates: { amount: 'sum', created: 'latest', name: 'percentEmpty' },
      },
    });
    expect(res).toEqual({
      rows: [],
      total: 0,
      aggregates: { amount: 0, created: null, name: 0 },
    });
  });
});

describe('indexes', () => {
  // Every query plan stage name ({ stage: 'IXSCAN' }) and aggregation stage ({ $sort }) in an
  // explain output.
  function planStages(plan, stages = []) {
    if (Array.isArray(plan)) {
      plan.forEach((item) => planStages(item, stages));
    } else if (plan !== null && typeof plan === 'object') {
      if (typeof plan.stage === 'string') stages.push(plan.stage);
      Object.entries(plan).forEach(([key, item]) => {
        if (key.startsWith('$')) stages.push(key);
        planStages(item, stages);
      });
    }
    return stages;
  }

  test('an index on the filter and sort fields serves the sort, with no blocking SORT', async () => {
    const indexed = 'tableQueryIndexed';
    await populateTestMongoDb({ collection: indexed, documents });
    const { client, collection: raw } = await getTestCollection({ collection: indexed });
    try {
      await raw.createIndex({ org_id: 1, amount: -1, _id: 1 });
      const compiled = compileTableQuery({
        properties: {
          pipeline,
          fields,
          view: { sort: [{ key: 'amount', desc: true }] },
          startRow: 10,
          endRow: 20,
        },
        now: new Date(),
      });
      const explained = await raw.aggregate(compiled.pipeline).explain('queryPlanner');
      // `stages` is the pipeline as MongoDB runs it; the explain also echoes the command sent.
      const stages = planStages(explained.stages);
      // The index gives the order: no blocking SORT in the plan and no $sort stage after it,
      // where every block fetch would sort all matching documents again.
      expect(stages).toContain('IXSCAN');
      expect(stages).not.toContain('SORT');
      expect(stages).not.toContain('$sort');
    } finally {
      await client.close();
    }
  });
});

describe('projection', () => {
  test('rows hold only the field paths and _id by default', async () => {
    const res = await query({ fields: { name: { type: 'text' } }, endRow: 1 });
    expect(res.rows).toEqual([{ _id: 'd00', name: 'Deal 0' }]);
  });

  test('returnFields adds paths a cell reads without a field for them', async () => {
    const res = await query({
      fields: { name: { type: 'text' } },
      returnFields: ['amount', 'owner'],
      endRow: 1,
    });
    expect(res.rows).toEqual([{ _id: 'd00', name: 'Deal 0', amount: 0, owner: { name: 'Ada' } }]);
  });

  test('project: false returns the documents the base pipeline returns', async () => {
    const res = await query({ fields: { name: { type: 'text' } }, project: false, endRow: 1 });
    expect(res.rows).toEqual([{ ...orgOneDocs[0], owner_id: { _oid: ownerIds[0].toHexString() } }]);
  });
});

describe('tenant scoping', () => {
  test('a tenant connection walls the table query to the tenant', async () => {
    const res = await MongoDBTableQuery({
      request: { fields, view: { filter: { key: 'stage', op: 'eq', value: 'won' } } },
      connection,
      tenant: { field: 'org_id', value: 'org_2' },
    });
    expect(res.total).toBe(5);
    expect(res.rows.every((row) => row.org_id === 'org_2')).toBe(true);
  });
});

describe('errors', () => {
  test('connection error', async () => {
    await expect(
      MongoDBTableQuery({
        request: { fields },
        connection: { ...connection, databaseUri: 'bad_uri' },
      })
    ).rejects.toThrow(
      'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
    );
  });

  test('a base pipeline MongoDB rejects is mapped', async () => {
    await expect(query({ pipeline: [{ $badStage: {} }] })).rejects.toThrow(
      'MongoDB: MongoDB rejected the MongoDBTableQuery command on collection "tableQuery" as malformed.'
    );
  });
});

describe('schema', () => {
  test('valid request', () => {
    expect(
      validate({
        schema,
        data: {
          pipeline,
          fields,
          view: null,
          startRow: 0,
          endRow: 200,
          groupPath: [],
          maxRows: 500,
          user: { id: 'u' },
          options: { maxTimeMS: 1000 },
          project: true,
          returnFields: ['owner.avatar'],
        },
      })
    ).toEqual({ valid: true });
  });

  test('fields is required', () => {
    expect(() => validate({ schema, data: {} })).toThrow(
      'MongoDBTableQuery request should have required property "fields".'
    );
  });

  test('field needs a known type', () => {
    expect(() => validate({ schema, data: { fields: { a: { path: 'a' } } } })).toThrow(
      'MongoDBTableQuery request field should have required property "type".'
    );
    expect(() => validate({ schema, data: { fields: { a: { type: 'money' } } } })).toThrow();
  });

  test('field with an unknown key is refused', () => {
    expect(() =>
      validate({ schema, data: { fields: { a: { type: 'text', serach: true } } } })
    ).toThrow(
      'MongoDBTableQuery request field should only have "type", "path", "search", "sortable", "filterable" and "groupable".'
    );
  });

  test('pipeline must be an array', () => {
    expect(() => validate({ schema, data: { fields, pipeline: {} } })).toThrow(
      'MongoDBTableQuery request property "pipeline" should be an array of stages.'
    );
  });

  test('maxRows must be a positive integer', () => {
    expect(() => validate({ schema, data: { fields, maxRows: 0 } })).toThrow(
      'MongoDBTableQuery request property "maxRows" should be at least 1.'
    );
  });
});
