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

import compileTableQuery from './compileTableQuery.js';

const now = new Date('2026-09-28T12:00:00.000Z');

const fields = {
  name: { type: 'text', search: true, groupable: true },
  email: { type: 'email', search: true },
  amount: { type: 'currency' },
  stage: { type: 'tag', groupable: true },
  owner: { type: 'text', path: 'owner.name', groupable: true },
  created: { type: 'date' },
};

const base = [{ $match: { org_id: 'org_1' } }];

const projection = {
  _id: 1,
  name: 1,
  email: 1,
  amount: 1,
  stage: 1,
  'owner.name': 1,
  created: 1,
};
const project = { $project: projection };

function compile(properties) {
  return compileTableQuery({ properties: { pipeline: base, fields, ...properties }, now });
}

describe('rows', () => {
  test('an empty view pages rows sorted by _id after the base pipeline', () => {
    expect(compile({ startRow: 0, endRow: 100 })).toEqual({
      grouped: false,
      options: { maxTimeMS: 10000 },
      specs: [],
      pipeline: [
        { $match: { org_id: 'org_1' } },
        { $sort: { _id: 1 } },
        {
          $facet: {
            rows: [{ $limit: 100 }, project],
            total: [{ $count: 'count' }],
          },
        },
      ],
    });
  });

  test('filter, search and sort compile after the base pipeline', () => {
    const { pipeline } = compile({
      view: {
        filter: { key: 'amount', op: 'gt', value: 10 },
        search: 'ada',
        sort: [{ key: 'amount', desc: true }, { key: 'owner' }],
      },
      startRow: 200,
      endRow: 400,
    });
    expect(pipeline).toEqual([
      { $match: { org_id: 'org_1' } },
      { $match: { amount: { $gt: 10 } } },
      { $match: { $or: [{ name: /ada/i }, { email: /ada/i }] } },
      { $sort: { amount: -1, 'owner.name': 1, _id: 1 } },
      {
        $facet: {
          rows: [{ $skip: 200 }, { $limit: 200 }, project],
          total: [{ $count: 'count' }],
        },
      },
    ]);
  });

  test('base pipeline stages always come first, so the view can only narrow them', () => {
    const { pipeline } = compile({
      view: {
        filter: {
          or: [
            { key: 'stage', op: 'notEmpty' },
            { key: 'stage', op: 'empty' },
          ],
        },
      },
    });
    expect(pipeline[0]).toEqual({ $match: { org_id: 'org_1' } });
    expect(pipeline[1].$match.$or).toHaveLength(2);
  });

  test('pipeline defaults to no base stages', () => {
    const { pipeline } = compileTableQuery({ properties: { fields, endRow: 10 }, now });
    expect(pipeline).toEqual([
      { $sort: { _id: 1 } },
      {
        $facet: {
          rows: [{ $limit: 10 }, project],
          total: [{ $count: 'count' }],
        },
      },
    ]);
  });

  test('each search word must match a search field', () => {
    const { pipeline } = compile({ view: { search: 'ada  love' } });
    expect(pipeline[1]).toEqual({
      $match: {
        $and: [
          { $or: [{ name: /ada/i }, { email: /ada/i }] },
          { $or: [{ name: /love/i }, { email: /love/i }] },
        ],
      },
    });
  });

  test('search over one field matches it directly', () => {
    const { pipeline } = compileTableQuery({
      properties: { fields: { name: { type: 'text', search: true } }, view: { search: 'ada' } },
      now,
    });
    expect(pipeline[0]).toEqual({ $match: { name: /ada/i } });
  });

  test('search input is escaped', () => {
    const { pipeline } = compile({ view: { search: '.*' } });
    expect(pipeline[1].$match.$or[0].name).toEqual(/\.\*/i);
  });

  test('search throws when no field has search: true', () => {
    expect(() =>
      compileTableQuery({
        properties: { fields: { amount: { type: 'number' } }, view: { search: 'x' } },
        now,
      })
    ).toThrow('MongoDBTableQuery view has a search, but no field in "fields" has "search: true".');
  });

  test('sort by _id does not add a second tiebreak', () => {
    const { pipeline } = compileTableQuery({
      properties: {
        fields: { id: { type: 'text', path: '_id' } },
        view: { sort: [{ key: 'id', desc: true }] },
      },
      now,
    });
    expect(pipeline[0]).toEqual({ $sort: { _id: -1 } });
  });

  test('a zero row request returns the total only', () => {
    const { pipeline } = compile({ startRow: 50, endRow: 50 });
    expect(pipeline.at(-1).$facet.rows).toEqual([
      { $skip: 50 },
      { $match: { $expr: false } },
      project,
    ]);
  });

  test('endRow defaults to startRow + maxRows', () => {
    const { pipeline } = compile({ startRow: 10, maxRows: 50 });
    expect(pipeline.at(-1).$facet.rows).toEqual([{ $skip: 10 }, { $limit: 50 }, project]);
  });
});

describe('sort before the facet', () => {
  test('rows are sorted before $facet, so an index on the sort fields can serve the sort', () => {
    const { pipeline } = compile({
      view: { filter: { key: 'stage', op: 'eq', value: 'won' }, sort: [{ key: 'amount' }] },
      endRow: 10,
    });
    expect(pipeline).toEqual([
      { $match: { org_id: 'org_1' } },
      { $match: { stage: /^won$/i } },
      { $sort: { amount: 1, _id: 1 } },
      {
        $facet: {
          rows: [{ $limit: 10 }, project],
          total: [{ $count: 'count' }],
        },
      },
    ]);
  });

  test('group levels are not sorted before $facet', () => {
    const { pipeline } = compile({ view: { group: [{ key: 'stage' }] }, groupPath: [] });
    expect(pipeline.map((stage) => Object.keys(stage)[0])).toEqual(['$match', '$facet']);
  });
});

describe('projection', () => {
  test('rows are projected to the field paths and _id by default', () => {
    const { pipeline } = compile({ endRow: 10 });
    expect(pipeline.at(-1).$facet.rows.at(-1)).toEqual({ $project: projection });
  });

  test('returnFields adds the paths cells read, and paths inside another path collapse into it', () => {
    const { pipeline } = compile({ endRow: 10, returnFields: ['owner', 'avatar.src', 'name'] });
    expect(pipeline.at(-1).$facet.rows.at(-1)).toEqual({
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        amount: 1,
        stage: 1,
        created: 1,
        owner: 1,
        'avatar.src': 1,
      },
    });
  });

  test('project: false returns the rows as the base pipeline leaves them', () => {
    const { pipeline } = compile({ endRow: 10, project: false });
    expect(pipeline.at(-1).$facet.rows).toEqual([{ $limit: 10 }]);
  });

  test('the leaf rows of a group are projected, group levels are not', () => {
    const view = { group: [{ key: 'stage' }] };
    const leaf = compile({ view, groupPath: ['won'], endRow: 10 });
    expect(leaf.pipeline.at(-1).$facet.rows.at(-1)).toEqual({ $project: projection });
    const groups = compile({ view, groupPath: [], endRow: 10 });
    expect(groups.pipeline.at(-1).$facet.groups.some((stage) => stage.$project)).toBe(false);
  });

  test('returnFields must be an array of dot paths', () => {
    expect(() => compile({ returnFields: 'owner' })).toThrow(
      'MongoDBTableQuery "returnFields" should be an array of dot paths. Received "owner".'
    );
    expect(() => compile({ returnFields: ['$where'] })).toThrow(
      'MongoDBTableQuery "returnFields" should be an array of dot paths. Received ["$where"].'
    );
    expect(() => compile({ returnFields: ['a..b'] })).toThrow(
      'MongoDBTableQuery "returnFields" should be an array of dot paths.'
    );
  });
});

describe('row validation', () => {
  test('negative or non-integer rows throw', () => {
    expect(() => compile({ startRow: -1, endRow: 10 })).toThrow(
      'MongoDBTableQuery startRow must be a non-negative integer. Received -1.'
    );
    expect(() => compile({ startRow: 1.5, endRow: 10 })).toThrow(
      'MongoDBTableQuery startRow must be a non-negative integer. Received 1.5.'
    );
    expect(() => compile({ startRow: '0', endRow: 10 })).toThrow(
      'MongoDBTableQuery startRow must be a non-negative integer. Received "0".'
    );
    expect(() => compile({ startRow: 10, endRow: 5 })).toThrow(
      'MongoDBTableQuery endRow must be an integer not less than startRow (10). Received 5.'
    );
    expect(() => compile({ startRow: 0, endRow: { $gt: 1 } })).toThrow(
      'MongoDBTableQuery endRow must be an integer not less than startRow (0). Received {"$gt":1}.'
    );
  });

  test('more rows than maxRows throws', () => {
    expect(() => compile({ startRow: 0, endRow: 1001 })).toThrow(
      'MongoDBTableQuery requested 1001 rows (startRow 0 to endRow 1001), more than maxRows (1000).'
    );
    expect(() => compile({ startRow: 100, endRow: 300, maxRows: 100 })).toThrow(
      'MongoDBTableQuery requested 200 rows (startRow 100 to endRow 300), more than maxRows (100).'
    );
  });
});

describe('grouping', () => {
  const view = { group: [{ key: 'stage' }, { key: 'owner' }] };

  test('groupPath shorter than group returns the next group level', () => {
    expect(compile({ view, groupPath: [], startRow: 0, endRow: 100 })).toEqual({
      grouped: true,
      options: { maxTimeMS: 10000 },
      specs: [],
      pipeline: [
        { $match: { org_id: 'org_1' } },
        {
          $facet: {
            groups: [
              { $group: { _id: '$stage', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
              { $limit: 100 },
            ],
            total: [{ $group: { _id: '$stage' } }, { $count: 'count' }],
          },
        },
      ],
    });
  });

  test('second level groups match the group path first', () => {
    const { pipeline, grouped } = compile({ view, groupPath: ['won'], startRow: 0, endRow: 100 });
    expect(grouped).toBe(true);
    expect(pipeline[1]).toEqual({ $match: { stage: 'won' } });
    expect(pipeline.at(-1).$facet.groups[0]).toEqual({
      $group: { _id: '$owner.name', count: { $sum: 1 } },
    });
  });

  test('a full group path returns leaf rows of that group', () => {
    const { pipeline, grouped } = compile({
      view,
      groupPath: ['won', null],
      startRow: 0,
      endRow: 100,
    });
    expect(grouped).toBe(false);
    expect(pipeline[1]).toEqual({ $match: { $and: [{ stage: 'won' }, { 'owner.name': null }] } });
    expect(pipeline.at(-2)).toEqual({ $sort: { _id: 1 } });
  });

  test('group values match exactly, not as text', () => {
    const { pipeline } = compile({ view, groupPath: ['Won'] });
    expect(pipeline[1]).toEqual({ $match: { stage: 'Won' } });
  });

  test('groups follow the view sort direction of the group key', () => {
    const { pipeline } = compile({
      view: { ...view, sort: [{ key: 'stage', desc: true }] },
      groupPath: [],
    });
    expect(pipeline.at(-1).$facet.groups[1]).toEqual({ $sort: { _id: -1 } });
  });

  test('groupPath values may be dates, numbers, booleans and ObjectIds', () => {
    const id = new ObjectId();
    [new Date(0), 3, true, id].forEach((value) => {
      const { pipeline } = compile({ view, groupPath: [value] });
      expect(pipeline[1]).toEqual({ $match: { stage: value } });
    });
  });

  test('groupPath with operator objects throws', () => {
    expect(() => compile({ view, groupPath: [{ $ne: null }] })).toThrow(
      'MongoDBTableQuery groupPath value for "stage" must be a string, number, boolean, date or null. Received {"$ne":null}.'
    );
    expect(() => compile({ view, groupPath: [['won']] })).toThrow(
      'MongoDBTableQuery groupPath value for "stage" must be a string, number, boolean, date or null. Received ["won"].'
    );
  });

  test('groupPath longer than group throws', () => {
    expect(() => compile({ view, groupPath: ['a', 'b', 'c'] })).toThrow(
      'MongoDBTableQuery groupPath must be an array no longer than view group (2). Received ["a","b","c"].'
    );
    expect(() => compile({ groupPath: 'won' })).toThrow(
      'MongoDBTableQuery groupPath must be an array no longer than view group (0). Received "won".'
    );
  });
});

describe('aggregates', () => {
  const isEmpty = (path) => ({ $in: [{ $ifNull: [`$${path}`, null] }, [null, '', []]] });

  test('aggregates compile to a whole-set facet branch', () => {
    const { pipeline, specs } = compile({
      view: {
        aggregates: {
          amount: 'sum',
          created: 'latest',
          name: 'countDistinct',
          email: 'percentEmpty',
          owner: 'countEmpty',
          stage: 'countNotEmpty',
        },
      },
    });
    expect(specs).toEqual([
      { key: 'amount', fn: 'sum', name: 'a0' },
      { key: 'created', fn: 'latest', name: 'a1' },
      { key: 'name', fn: 'countDistinct', name: 'a2' },
      { key: 'email', fn: 'percentEmpty', name: 'a3' },
      { key: 'owner', fn: 'countEmpty', name: 'a4' },
      { key: 'stage', fn: 'countNotEmpty', name: 'a5' },
    ]);
    expect(pipeline.at(-1).$facet.aggregates).toEqual([
      {
        $group: {
          _id: null,
          a0: { $sum: '$amount' },
          a1: { $max: '$created' },
          a3: { $sum: { $cond: [isEmpty('email'), 1, 0] } },
          a3_rows: { $sum: 1 },
          a4: { $sum: { $cond: [isEmpty('owner.name'), 1, 0] } },
          a5: { $sum: { $cond: [isEmpty('stage'), 0, 1] } },
        },
      },
      {
        $addFields: {
          a3: { $cond: [{ $eq: ['$a3_rows', 0] }, 0, { $divide: ['$a3', '$a3_rows'] }] },
        },
      },
    ]);
    // countDistinct counts the groups of the value in its own branch, never building a set
    // of every distinct value in one document.
    expect(pipeline.at(-1).$facet.distinct_a2).toEqual([
      { $group: { _id: '$name' } },
      { $match: { _id: { $nin: [null, '', []] } } },
      { $count: 'count' },
    ]);
  });

  test('min and max on text compare the non-empty strings', () => {
    const { pipeline } = compile({ view: { aggregates: { name: 'min', email: 'max' } } });
    expect(pipeline.at(-1).$facet.aggregates).toEqual([
      {
        $group: {
          _id: null,
          a0: { $min: { $cond: [isEmpty('name'), '$$REMOVE', '$name'] } },
          a1: { $max: { $cond: [isEmpty('email'), '$$REMOVE', '$email'] } },
        },
      },
    ]);
  });

  test('countDistinct needs a groupable field', () => {
    expect(() => compile({ view: { aggregates: { amount: 'countDistinct' } } })).toThrow(
      'MongoDBTableQuery aggregate "countDistinct" on "amount" groups by its values, so the field needs "groupable: true".'
    );
  });

  test('group levels count distinct values per group', () => {
    const { pipeline } = compile({
      view: { group: [{ key: 'stage' }], aggregates: { owner: 'countDistinct' } },
    });
    expect(pipeline.at(-1).$facet.groups.slice(0, 2)).toEqual([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          a0: { $addToSet: { $cond: [isEmpty('owner.name'), '$$REMOVE', '$owner.name'] } },
        },
      },
      { $addFields: { a0: { $size: '$a0' } } },
    ]);
    expect(pipeline.at(-1).$facet.aggregates).toEqual([{ $group: { _id: null } }]);
    expect(pipeline.at(-1).$facet.distinct_a0).toEqual([
      { $group: { _id: '$owner.name' } },
      { $match: { _id: { $nin: [null, '', []] } } },
      { $count: 'count' },
    ]);
  });

  test('count, avg, min, max and earliest accumulators', () => {
    const { pipeline } = compileTableQuery({
      properties: {
        fields: {
          a: { type: 'number' },
          b: { type: 'number' },
          c: { type: 'number' },
          d: { type: 'number' },
          e: { type: 'date' },
        },
        view: { aggregates: { a: 'count', b: 'avg', c: 'min', d: 'max', e: 'earliest' } },
      },
      now,
    });
    expect(pipeline.at(-1).$facet.aggregates).toEqual([
      {
        $group: {
          _id: null,
          a0: { $sum: 1 },
          a1: { $avg: '$b' },
          a2: { $min: '$c' },
          a3: { $max: '$d' },
          a4: { $min: '$e' },
        },
      },
    ]);
  });

  test('group levels carry the view aggregates', () => {
    const { pipeline } = compile({
      view: { group: [{ key: 'stage' }], aggregates: { amount: 'avg' } },
    });
    expect(pipeline.at(-1).$facet.groups[0]).toEqual({
      $group: { _id: '$stage', count: { $sum: 1 }, a0: { $avg: '$amount' } },
    });
    expect(pipeline.at(-1).$facet.aggregates).toEqual([
      { $group: { _id: null, a0: { $avg: '$amount' } } },
    ]);
  });
});

describe('time zone', () => {
  test('timezone sets the days date filters compare, UTC by default', () => {
    const filter = { key: 'created', op: 'eq', value: '2026-01-03' };
    expect(compile({ view: { filter } }).pipeline[1]).toEqual({
      $match: {
        created: {
          $gte: new Date('2026-01-03T00:00:00.000Z'),
          $lt: new Date('2026-01-04T00:00:00.000Z'),
        },
      },
    });
    expect(compile({ view: { filter }, timezone: 'Asia/Tokyo' }).pipeline[1]).toEqual({
      $match: {
        created: {
          $gte: new Date('2026-01-02T15:00:00.000Z'),
          $lt: new Date('2026-01-03T15:00:00.000Z'),
        },
      },
    });
  });

  test('an unknown timezone is refused', () => {
    expect(() => compile({ timezone: 'Mars/Base' })).toThrow(
      'MongoDBTableQuery "timezone" should be an IANA time zone name such as "Europe/London". Received "Mars/Base".'
    );
  });
});

describe('options', () => {
  test('the aggregation runs with a default maxTimeMS of 10 seconds', () => {
    expect(compile({}).options).toEqual({ maxTimeMS: 10000 });
  });

  test('options override the default maxTimeMS and pass through', () => {
    expect(compile({ options: { maxTimeMS: 500, allowDiskUse: true } }).options).toEqual({
      maxTimeMS: 500,
      allowDiskUse: true,
    });
  });
});

describe('config validation', () => {
  test('base pipeline with a write stage throws', () => {
    expect(() =>
      compileTableQuery({ properties: { fields, pipeline: [{ $out: 'copy' }] }, now })
    ).toThrow('MongoDBTableQuery pipeline can not contain a "$out" stage.');
    expect(() =>
      compileTableQuery({ properties: { fields, pipeline: [{ $merge: { into: 'x' } }] }, now })
    ).toThrow('MongoDBTableQuery pipeline can not contain a "$merge" stage.');
  });

  test('unknown field type throws', () => {
    expect(() =>
      compileTableQuery({ properties: { fields: { a: { type: 'money' } } }, now })
    ).toThrow('MongoDBTableQuery field "a" has unknown type "money".');
  });

  test('field path with a $ segment throws', () => {
    expect(() =>
      compileTableQuery({ properties: { fields: { a: { type: 'text', path: '$where' } } }, now })
    ).toThrow('MongoDBTableQuery field "a" has an invalid path. Received "$where".');
    expect(() =>
      compileTableQuery({ properties: { fields: { a: { type: 'text', path: 'a..b' } } }, now })
    ).toThrow('MongoDBTableQuery field "a" has an invalid path. Received "a..b".');
  });
});
