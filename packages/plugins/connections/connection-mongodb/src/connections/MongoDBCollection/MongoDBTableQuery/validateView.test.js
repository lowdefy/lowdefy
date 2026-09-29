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

import normalizeFields from './normalizeFields.js';
import validateView from './validateView.js';

const fieldsByKey = normalizeFields({
  fields: {
    name: { type: 'text', search: true },
    amount: { type: 'currency' },
    score: { type: 'number', sortable: false, filterable: false },
    created: { type: 'date' },
    updated: { type: 'datetime' },
    active: { type: 'boolean' },
    tags: { type: 'tags' },
    owner: { type: 'relation', path: 'owner.id' },
    stage: { type: 'tag', groupable: true },
    meta: { type: 'json' },
  },
});

const user = { id: 'user_1', roles: ['admin', 'sales'], organization: { id: 'org_1' } };

function filter(condition) {
  return validateView({ view: { filter: condition }, fieldsByKey, user }).filter;
}

describe('view shape', () => {
  test('validateView returns empty defaults when view is null', () => {
    expect(validateView({ view: null, fieldsByKey })).toEqual({
      sort: [],
      filter: null,
      search: null,
      group: [],
      aggregates: {},
    });
  });

  test('validateView ignores display parts of the Table view', () => {
    const view = { columns: [{ key: 'name', width: 20 }], density: 'compact', wrap: true };
    expect(validateView({ view, fieldsByKey })).toEqual({
      sort: [],
      filter: null,
      search: null,
      group: [],
      aggregates: {},
    });
  });

  test('validateView throws when view is not an object', () => {
    expect(() => validateView({ view: 'all', fieldsByKey })).toThrow(
      'MongoDBTableQuery view is not an object. Received "all".'
    );
  });
});

describe('filter validation and coercion', () => {
  test('text operators keep string values', () => {
    ['eq', 'ne', 'contains', 'notContains', 'startsWith', 'endsWith'].forEach((op) => {
      expect(filter({ key: 'name', op, value: 'Ada' })).toEqual({ key: 'name', op, value: 'Ada' });
    });
  });

  test('numeric values are coerced from numeric strings', () => {
    expect(filter({ key: 'amount', op: 'gt', value: '12.5' })).toEqual({
      key: 'amount',
      op: 'gt',
      value: 12.5,
    });
    expect(filter({ key: 'amount', op: 'between', value: ['1', 10] })).toEqual({
      key: 'amount',
      op: 'between',
      value: [1, 10],
    });
  });

  test('between allows one open bound', () => {
    expect(filter({ key: 'amount', op: 'between', value: [null, 10] }).value).toEqual([null, 10]);
  });

  test('between throws when both bounds are empty', () => {
    expect(() => filter({ key: 'amount', op: 'between', value: [null, null] })).toThrow(
      'MongoDBTableQuery filter on "amount": operator "between" expects an array [from, to] with at least one bound. Received [null,null].'
    );
  });

  test('date values are coerced from strings, numbers and dates', () => {
    const date = new Date('2026-03-01T00:00:00.000Z');
    expect(filter({ key: 'created', op: 'before', value: '2026-03-01' }).value).toEqual(date);
    expect(filter({ key: 'created', op: 'after', value: date.getTime() }).value).toEqual(date);
    expect(filter({ key: 'created', op: 'eq', value: date }).value).toEqual(date);
  });

  test('within accepts last or next with a unit', () => {
    expect(filter({ key: 'created', op: 'within', value: { last: 7, unit: 'day' } }).value).toEqual(
      { last: 7, unit: 'day' }
    );
    expect(
      filter({ key: 'updated', op: 'within', value: { next: 2, unit: 'month' } }).value
    ).toEqual({ next: 2, unit: 'month' });
  });

  test('within throws for a bad unit, count or extra key', () => {
    [
      { last: 7, unit: 'hour' },
      { last: 0, unit: 'day' },
      { last: 1.5, unit: 'day' },
      { last: 7, next: 1, unit: 'day' },
      { last: 7, unit: 'day', $where: 'sleep(1000)' },
      'last week',
    ].forEach((value) => {
      expect(() => filter({ key: 'created', op: 'within', value })).toThrow(
        'MongoDBTableQuery filter on "created": operator "within" expects { last | next: positive integer, unit: day | week | month | year }.'
      );
    });
  });

  test('value-less operators take no value', () => {
    ['empty', 'notEmpty'].forEach((op) => {
      expect(filter({ key: 'name', op })).toEqual({ key: 'name', op, value: undefined });
    });
    ['isTrue', 'isFalse'].forEach((op) => {
      expect(filter({ key: 'active', op })).toEqual({ key: 'active', op, value: undefined });
    });
    expect(() => filter({ key: 'name', op: 'empty', value: { $exists: true } })).toThrow(
      'MongoDBTableQuery filter on "name": operator "empty" expects no value. Received {"$exists":true}.'
    );
  });

  test('boolean eq requires a boolean', () => {
    expect(filter({ key: 'active', op: 'eq', value: true }).value).toBe(true);
    expect(() => filter({ key: 'active', op: 'eq', value: 'true' })).toThrow(
      'MongoDBTableQuery filter on "active": operator "eq" expects a boolean for type "boolean". Received "true".'
    );
  });

  test('array fields accept in, nin and contains', () => {
    expect(filter({ key: 'tags', op: 'in', value: ['vip', 'new'] }).value).toEqual(['vip', 'new']);
    expect(filter({ key: 'tags', op: 'nin', value: ['vip'] }).value).toEqual(['vip']);
    expect(filter({ key: 'tags', op: 'contains', value: 'vip' }).value).toBe('vip');
  });

  test('ObjectId values pass for relation fields', () => {
    const id = new ObjectId();
    expect(filter({ key: 'owner', op: 'eq', value: id }).value).toBe(id);
  });

  test('in throws when the value is not an array', () => {
    expect(() => filter({ key: 'stage', op: 'in', value: 'won' })).toThrow(
      'MongoDBTableQuery filter on "stage": operator "in" expects an array of at most 500 values. Received "won".'
    );
  });

  test('in throws with more than 500 values', () => {
    const value = Array.from({ length: 501 }, (_, index) => `s${index}`);
    expect(() => filter({ key: 'stage', op: 'in', value })).toThrow(
      'operator "in" expects an array of at most 500 values.'
    );
  });

  test('groups count toward the 200 condition limit', () => {
    const leaf = { key: 'name', op: 'eq', value: 'a' };
    const nested = { and: Array.from({ length: 100 }, () => ({ or: [leaf] })) };
    expect(() => filter(nested)).toThrow(
      'MongoDBTableQuery filter has more than 200 conditions and groups.'
    );
    const empty = { and: Array.from({ length: 200 }, () => ({ and: [] })) };
    expect(() => filter(empty)).toThrow(
      'MongoDBTableQuery filter has more than 200 conditions and groups.'
    );
    expect(() => filter({ and: Array.from({ length: 99 }, () => ({ or: [leaf] })) })).not.toThrow();
  });

  test('a filter has at most 1000 values in all', () => {
    const list = (offset) => Array.from({ length: 400 }, (_, index) => `s${offset + index}`);
    const leaves = [0, 400, 800].map((offset) => ({ key: 'stage', op: 'in', value: list(offset) }));
    expect(() => filter({ and: leaves.slice(0, 2) })).not.toThrow();
    expect(() => filter({ or: leaves })).toThrow(
      'MongoDBTableQuery filter has more than 1000 values.'
    );
  });

  test('a string value has at most 200 characters', () => {
    const long = 'a'.repeat(201);
    expect(() => filter({ key: 'name', op: 'contains', value: long })).toThrow(
      'MongoDBTableQuery filter on "name": a value can have at most 200 characters. Received a string of 201.'
    );
    expect(() => filter({ key: 'stage', op: 'in', value: ['won', long] })).toThrow(
      'MongoDBTableQuery filter on "stage": a value can have at most 200 characters. Received a string of 201.'
    );
    expect(() => filter({ key: 'tags', op: 'contains', value: long })).toThrow(
      'a value can have at most 200 characters'
    );
    expect(filter({ key: 'name', op: 'startsWith', value: 'a'.repeat(200) }).value).toHaveLength(
      200
    );
  });

  test('nested and/or groups are validated recursively', () => {
    expect(
      filter({
        or: [
          { key: 'stage', op: 'eq', value: 'won' },
          {
            and: [
              { key: 'amount', op: 'gte', value: 100 },
              { key: 'active', op: 'isTrue' },
            ],
          },
        ],
      })
    ).toEqual({
      or: [
        { key: 'stage', op: 'eq', value: 'won' },
        {
          and: [
            { key: 'amount', op: 'gte', value: 100 },
            { key: 'active', op: 'isTrue', value: undefined },
          ],
        },
      ],
    });
  });
});

describe('filter rejection', () => {
  test('non-string key throws', () => {
    expect(() => filter({ key: { $ne: null }, op: 'eq', value: 'x' })).toThrow(
      'MongoDBTableQuery view filter key is not a string. Received {"$ne":null}.'
    );
  });

  test('unknown key throws', () => {
    expect(() => filter({ key: 'password', op: 'eq', value: 'x' })).toThrow(
      'MongoDBTableQuery view filter key "password" is not in the request "fields".'
    );
  });

  test('prototype keys are not fields', () => {
    ['__proto__', 'constructor', 'toString'].forEach((key) => {
      expect(() => filter({ key, op: 'eq', value: 'x' })).toThrow(
        `MongoDBTableQuery view filter key "${key}" is not in the request "fields".`
      );
    });
  });

  test('operator not allowed for the type throws', () => {
    expect(() => filter({ key: 'amount', op: 'contains', value: '1' })).toThrow(
      'MongoDBTableQuery filter on "amount": operator "contains" is not allowed for type "currency". Allowed operators: eq, ne, in, nin, empty, notEmpty, gt, gte, lt, lte, between.'
    );
    expect(() => filter({ key: 'name', op: 'gt', value: 'a' })).toThrow(
      'operator "gt" is not allowed for type "text".'
    );
    expect(() => filter({ key: 'meta', op: 'contains', value: 'a' })).toThrow(
      'operator "contains" is not allowed for type "json".'
    );
  });

  test('MongoDB operators as op are refused', () => {
    ['$where', '$regex', '$gt', '$expr'].forEach((op) => {
      expect(() => filter({ key: 'name', op, value: 'x' })).toThrow(
        `operator ${JSON.stringify(op)} is not allowed for type "text".`
      );
    });
  });

  test('$where condition is refused', () => {
    expect(() => filter({ $where: 'this.amount > 0' })).toThrow(
      'MongoDBTableQuery filter condition has an unknown key "$where". Received {"$where":"this.amount > 0"}.'
    );
  });

  test('raw MongoDB condition is refused', () => {
    expect(() => filter({ amount: { $gt: 0 } })).toThrow(
      'MongoDBTableQuery filter condition has an unknown key "amount".'
    );
    expect(() => filter({ $expr: { $gt: ['$amount', 0] } })).toThrow(
      'MongoDBTableQuery filter condition has an unknown key "$expr".'
    );
  });

  test('extra keys on a leaf are refused', () => {
    expect(() => filter({ key: 'name', op: 'eq', value: 'x', $where: '1' })).toThrow(
      'MongoDBTableQuery filter condition has an unknown key "$where".'
    );
  });

  test('operator objects as values are refused', () => {
    expect(() => filter({ key: 'name', op: 'eq', value: { $gt: '' } })).toThrow(
      'MongoDBTableQuery filter on "name": operator "eq" expects a string or number for type "text". Received {"$gt":""}.'
    );
    expect(() => filter({ key: 'amount', op: 'gt', value: { $where: 'true' } })).toThrow(
      'MongoDBTableQuery filter on "amount": operator "gt" expects a number for type "currency". Received {"$where":"true"}.'
    );
    expect(() => filter({ key: 'name', op: 'contains', value: { $regex: '.*' } })).toThrow(
      'MongoDBTableQuery filter on "name": operator "contains" expects a string. Received {"$regex":".*"}.'
    );
    expect(() => filter({ key: 'stage', op: 'in', value: [{ $ne: null }] })).toThrow(
      'MongoDBTableQuery filter on "stage": operator "in" expects a string or number for type "tag". Received {"$ne":null}.'
    );
    expect(() => filter({ key: 'created', op: 'eq', value: { $gt: new Date(0) } })).toThrow(
      'operator "eq" expects a date for type "date".'
    );
    expect(() => filter({ key: 'meta', op: 'eq', value: { $exists: true } })).toThrow(
      'MongoDBTableQuery filter on "meta": operator "eq" expects a string, number or boolean for type "json".'
    );
  });

  test('arrays as scalar values are refused', () => {
    expect(() => filter({ key: 'name', op: 'eq', value: ['a', 'b'] })).toThrow(
      'MongoDBTableQuery filter on "name": operator "eq" expects a string or number for type "text". Received ["a","b"].'
    );
  });

  test('non-numeric and non-date values are refused', () => {
    expect(() => filter({ key: 'amount', op: 'lt', value: 'ten' })).toThrow(
      'MongoDBTableQuery filter on "amount": operator "lt" expects a number for type "currency". Received "ten".'
    );
    expect(() => filter({ key: 'amount', op: 'lt', value: '' })).toThrow('expects a number');
    expect(() => filter({ key: 'created', op: 'after', value: 'yesterday' })).toThrow(
      'MongoDBTableQuery filter on "created": operator "after" expects a date for type "date". Received "yesterday".'
    );
  });

  test('missing value throws', () => {
    expect(() => filter({ key: 'name', op: 'eq' })).toThrow(
      'MongoDBTableQuery filter on "name": operator "eq" expects a string or number for type "text".'
    );
  });

  test('field with filterable false throws', () => {
    expect(() => filter({ key: 'score', op: 'eq', value: 1 })).toThrow(
      'MongoDBTableQuery field "score" is not filterable.'
    );
  });

  test('group with two keys or a non-array throws', () => {
    expect(() => filter({ and: [], or: [] })).toThrow(
      'MongoDBTableQuery filter group must have exactly one "and" or "or" array.'
    );
    expect(() => filter({ and: { key: 'name' } })).toThrow(
      'MongoDBTableQuery filter group must have exactly one "and" or "or" array.'
    );
  });

  test('non-object condition throws', () => {
    expect(() => filter({ and: ['name'] })).toThrow(
      'MongoDBTableQuery filter condition is not an object. Received "name".'
    );
  });

  test('filter nested too deep throws', () => {
    let condition = { key: 'name', op: 'eq', value: 'a' };
    for (let index = 0; index < 10; index += 1) {
      condition = { and: [condition] };
    }
    expect(() => filter(condition)).toThrow(
      'MongoDBTableQuery filter is nested deeper than 8 levels.'
    );
  });

  test('filter with too many conditions throws', () => {
    const condition = {
      or: Array.from({ length: 201 }, () => ({ key: 'name', op: 'eq', value: 'a' })),
    };
    expect(() => filter(condition)).toThrow(
      'MongoDBTableQuery filter has more than 200 conditions and groups.'
    );
  });
});

describe('$user values', () => {
  test('$user resolves from the server user', () => {
    expect(filter({ key: 'owner', op: 'eq', value: { $user: 'id' } }).value).toBe('user_1');
    expect(filter({ key: 'owner', op: 'eq', value: { $user: 'organization.id' } }).value).toBe(
      'org_1'
    );
  });

  test('$user resolves a whole list and list items', () => {
    expect(filter({ key: 'tags', op: 'in', value: { $user: 'roles' } }).value).toEqual([
      'admin',
      'sales',
    ]);
    expect(filter({ key: 'owner', op: 'in', value: [{ $user: 'id' }, 'user_2'] }).value).toEqual([
      'user_1',
      'user_2',
    ]);
  });

  test('$user throws when the request has no user property', () => {
    expect(() =>
      validateView({
        view: { filter: { key: 'owner', op: 'eq', value: { $user: 'id' } } },
        fieldsByKey,
      })
    ).toThrow(
      'MongoDBTableQuery filter on "owner" uses "$user", but the request has no "user" property. Set the request property "user: { _user: true }".'
    );
  });

  test('$user throws when the user value is not set, instead of matching null', () => {
    expect(() => filter({ key: 'owner', op: 'eq', value: { $user: 'missing' } })).toThrow(
      'MongoDBTableQuery filter on "owner" uses "$user: missing", which is not set for the current user.'
    );
  });

  test('$user with extra keys or a non-string path throws', () => {
    expect(() => filter({ key: 'owner', op: 'eq', value: { $user: 'id', $ne: 'x' } })).toThrow(
      'MongoDBTableQuery filter on "owner" has an invalid "$user" value.'
    );
    expect(() => filter({ key: 'owner', op: 'eq', value: { $user: { $ne: 1 } } })).toThrow(
      'MongoDBTableQuery filter on "owner" has an invalid "$user" value.'
    );
  });

  test('$user resolving to an object is refused', () => {
    expect(() => filter({ key: 'owner', op: 'eq', value: { $user: 'organization' } })).toThrow(
      'MongoDBTableQuery filter on "owner": operator "eq" expects a string or number for type "relation". Received {"id":"org_1"}.'
    );
  });
});

describe('sort, search, group and aggregates', () => {
  test('sort is normalised', () => {
    expect(
      validateView({
        view: { sort: [{ key: 'amount', desc: true }, { key: 'name' }] },
        fieldsByKey,
      }).sort
    ).toEqual([
      { key: 'amount', desc: true },
      { key: 'name', desc: false },
    ]);
  });

  test('sort rejects unknown, unsortable and malformed items', () => {
    expect(() => validateView({ view: { sort: [{ key: 'secret' }] }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view sort key "secret" is not in the request "fields".'
    );
    expect(() => validateView({ view: { sort: [{ key: 'score' }] }, fieldsByKey })).toThrow(
      'MongoDBTableQuery field "score" is not sortable.'
    );
    expect(() =>
      validateView({ view: { sort: [{ key: 'name', desc: 'yes' }] }, fieldsByKey })
    ).toThrow('MongoDBTableQuery view sort "desc" on "name" is not a boolean. Received "yes".');
    expect(() => validateView({ view: { sort: { amount: -1 } }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view sort must be an array of at most 10 { key, desc } objects.'
    );
    expect(() =>
      validateView({ view: { sort: [{ key: 'name', $natural: 1 }] }, fieldsByKey })
    ).toThrow('MongoDBTableQuery view sort item must be a { key, desc } object.');
  });

  test('search is trimmed and empty search is null', () => {
    expect(validateView({ view: { search: '  ada  ' }, fieldsByKey }).search).toBe('ada');
    expect(validateView({ view: { search: '   ' }, fieldsByKey }).search).toBe(null);
  });

  test('search rejects non-strings and long strings', () => {
    expect(() => validateView({ view: { search: { $regex: '.*' } }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view search must be a string of at most 200 characters. Received {"$regex":".*"}.'
    );
    expect(() => validateView({ view: { search: 'a'.repeat(201) }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view search must be a string of at most 200 characters.'
    );
  });

  test('group accepts groupable fields only', () => {
    expect(validateView({ view: { group: [{ key: 'stage' }] }, fieldsByKey }).group).toEqual([
      { key: 'stage' },
    ]);
    expect(() => validateView({ view: { group: [{ key: 'name' }] }, fieldsByKey })).toThrow(
      'MongoDBTableQuery field "name" is not groupable. Set "groupable: true" on the field.'
    );
    expect(() =>
      validateView({ view: { group: [{ key: 'stage' }, { key: 'stage' }] }, fieldsByKey })
    ).toThrow('MongoDBTableQuery view groups by "stage" more than once.');
    expect(() => validateView({ view: { group: ['stage'] }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view group item must be a { key } object. Received "stage".'
    );
  });

  test('group must be an array', () => {
    expect(() => validateView({ view: { group: 'stage' }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view group must be an array of at most 5 { key } objects. Received "stage".'
    );
  });

  test('group refuses array fields', () => {
    const arrayFields = normalizeFields({ fields: { tags: { type: 'tags', groupable: true } } });
    expect(() =>
      validateView({ view: { group: [{ key: 'tags' }] }, fieldsByKey: arrayFields })
    ).toThrow('MongoDBTableQuery field "tags" of type "tags" can not be grouped.');
  });

  test('aggregates are checked against the field type', () => {
    expect(
      validateView({
        view: { aggregates: { amount: 'sum', created: 'latest', stage: 'countDistinct' } },
        fieldsByKey,
      }).aggregates
    ).toEqual({ amount: 'sum', created: 'latest', stage: 'countDistinct' });
    expect(() => validateView({ view: { aggregates: { name: 'sum' } }, fieldsByKey })).toThrow(
      'MongoDBTableQuery aggregate "sum" is not allowed on "name" of type "text". Allowed aggregates: count, countDistinct, countEmpty, countNotEmpty, percentEmpty, min, max.'
    );
    expect(() =>
      validateView({ view: { aggregates: { amount: { $sum: '$amount' } } }, fieldsByKey })
    ).toThrow('MongoDBTableQuery aggregate {"$sum":"$amount"} is not allowed on "amount"');
    expect(() => validateView({ view: { aggregates: { secret: 'count' } }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view aggregates key "secret" is not in the request "fields".'
    );
    expect(() => validateView({ view: { aggregates: ['sum'] }, fieldsByKey })).toThrow(
      'MongoDBTableQuery view aggregates must be an object of { [key]: function }.'
    );
  });
});
