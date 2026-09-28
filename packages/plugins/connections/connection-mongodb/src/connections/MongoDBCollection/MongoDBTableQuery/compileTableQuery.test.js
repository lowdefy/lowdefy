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
  name: { type: 'text', search: true },
  email: { type: 'email', search: true },
  amount: { type: 'currency' },
  stage: { type: 'tag', groupable: true },
  owner: { type: 'text', path: 'owner.name', groupable: true },
  created: { type: 'date' },
};

const base = [{ $match: { org_id: 'org_1' } }];

function compile(properties) {
  return compileTableQuery({ properties: { pipeline: base, fields, ...properties }, now });
}

describe('rows', () => {
  test('an empty view pages rows sorted by _id after the base pipeline', () => {
    expect(compile({ startRow: 0, endRow: 100 })).toEqual({
      grouped: false,
      specs: [],
      pipeline: [
        { $match: { org_id: 'org_1' } },
        {
          $facet: {
            rows: [{ $sort: { _id: 1 } }, { $limit: 100 }],
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
      {
        $facet: {
          rows: [
            { $sort: { amount: -1, 'owner.name': 1, _id: 1 } },
            { $skip: 200 },
            { $limit: 200 },
          ],
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
      {
        $facet: {
          rows: [{ $sort: { _id: 1 } }, { $limit: 10 }],
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
    expect(pipeline[0].$facet.rows[0]).toEqual({ $sort: { _id: -1 } });
  });

  test('a zero row request returns the total only', () => {
    const { pipeline } = compile({ startRow: 50, endRow: 50 });
    expect(pipeline[1].$facet.rows).toEqual([
      { $sort: { _id: 1 } },
      { $skip: 50 },
      { $match: { $expr: false } },
    ]);
  });

  test('endRow defaults to startRow + maxRows', () => {
    const { pipeline } = compile({ startRow: 10, maxRows: 50 });
    expect(pipeline[1].$facet.rows).toEqual([{ $sort: { _id: 1 } }, { $skip: 10 }, { $limit: 50 }]);
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
    expect(pipeline[2].$facet.groups[0]).toEqual({
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
    expect(pipeline[2].$facet.rows[0]).toEqual({ $sort: { _id: 1 } });
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
    expect(pipeline[1].$facet.groups[1]).toEqual({ $sort: { _id: -1 } });
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
    expect(pipeline[1].$facet.aggregates).toEqual([
      {
        $group: {
          _id: null,
          a0: { $sum: '$amount' },
          a1: { $max: '$created' },
          a2: { $addToSet: { $cond: [isEmpty('name'), '$$REMOVE', '$name'] } },
          a3: { $sum: { $cond: [isEmpty('email'), 1, 0] } },
          a3_rows: { $sum: 1 },
          a4: { $sum: { $cond: [isEmpty('owner.name'), 1, 0] } },
          a5: { $sum: { $cond: [isEmpty('stage'), 0, 1] } },
        },
      },
      {
        $addFields: {
          a2: { $size: '$a2' },
          a3: { $cond: [{ $eq: ['$a3_rows', 0] }, 0, { $divide: ['$a3', '$a3_rows'] }] },
        },
      },
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
    expect(pipeline[0].$facet.aggregates).toEqual([
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
    expect(pipeline[1].$facet.groups[0]).toEqual({
      $group: { _id: '$stage', count: { $sum: 1 }, a0: { $avg: '$amount' } },
    });
    expect(pipeline[1].$facet.aggregates).toEqual([
      { $group: { _id: null, a0: { $avg: '$amount' } } },
    ]);
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
