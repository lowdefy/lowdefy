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

import compileCondition from './compileCondition.js';
import normalizeFields from './normalizeFields.js';
import validateView from './validateView.js';

const fieldsByKey = normalizeFields({
  fields: {
    name: { type: 'text' },
    amount: { type: 'currency' },
    created: { type: 'date' },
    updated: { type: 'datetime' },
    active: { type: 'boolean' },
    tags: { type: 'tags' },
    owner: { type: 'relation', path: 'owner.id' },
    stage: { type: 'status' },
    meta: { type: 'json' },
    person: { type: 'avatar', path: 'person.name' },
  },
});

const now = new Date('2026-09-28T12:00:00.000Z');
const user = { id: 'user_1' };

function compile(condition) {
  const { filter } = validateView({ view: { filter: condition }, fieldsByKey, user });
  return compileCondition({ condition: filter, fieldsByKey, now });
}

describe('all types', () => {
  test('eq and ne on text match case-insensitively and escape the value', () => {
    expect(compile({ key: 'name', op: 'eq', value: 'A.b*' })).toEqual({ name: /^A\.b\*$/i });
    expect(compile({ key: 'name', op: 'ne', value: 'Ada' })).toEqual({
      name: { $not: /^Ada$/i },
    });
  });

  test('eq and ne on numbers match exactly', () => {
    expect(compile({ key: 'amount', op: 'eq', value: '5' })).toEqual({ amount: 5 });
    expect(compile({ key: 'amount', op: 'ne', value: 5 })).toEqual({ amount: { $ne: 5 } });
  });

  test('eq with a number on a text field matches exactly', () => {
    expect(compile({ key: 'stage', op: 'eq', value: 3 })).toEqual({ stage: 3 });
  });

  test('eq with an ObjectId matches exactly on the field path', () => {
    const id = new ObjectId();
    expect(compile({ key: 'owner', op: 'eq', value: id })).toEqual({ 'owner.id': id });
    expect(compile({ key: 'owner', op: 'ne', value: id })).toEqual({ 'owner.id': { $ne: id } });
  });

  test('in and nin match any or none of the values', () => {
    expect(compile({ key: 'stage', op: 'in', value: ['Won', 2] })).toEqual({
      stage: { $in: [/^Won$/i, 2] },
    });
    expect(compile({ key: 'stage', op: 'nin', value: ['Lost'] })).toEqual({
      stage: { $nin: [/^Lost$/i] },
    });
    expect(compile({ key: 'amount', op: 'in', value: [1, '2'] })).toEqual({
      amount: { $in: [1, 2] },
    });
  });

  test('empty covers null, missing, empty string and empty array', () => {
    expect(compile({ key: 'name', op: 'empty' })).toEqual({
      $or: [{ name: null }, { name: '' }, { name: { $size: 0 } }],
    });
  });

  test('notEmpty is the complement of empty', () => {
    expect(compile({ key: 'tags', op: 'notEmpty' })).toEqual({
      $nor: [{ tags: null }, { tags: '' }, { tags: { $size: 0 } }],
    });
  });

  test('eq on json fields matches exactly', () => {
    expect(compile({ key: 'meta', op: 'eq', value: 'x' })).toEqual({ meta: 'x' });
    expect(compile({ key: 'meta', op: 'eq', value: true })).toEqual({ meta: true });
  });
});

describe('text operators', () => {
  test('contains, notContains, startsWith and endsWith use escaped case-insensitive regex', () => {
    expect(compile({ key: 'name', op: 'contains', value: '(a|b)' })).toEqual({
      name: /\(a\|b\)/i,
    });
    expect(compile({ key: 'name', op: 'notContains', value: 'a+' })).toEqual({
      name: { $not: /a\+/i },
    });
    expect(compile({ key: 'name', op: 'startsWith', value: '^x' })).toEqual({ name: /^\^x/i });
    expect(compile({ key: 'name', op: 'endsWith', value: '$' })).toEqual({ name: /\$$/i });
  });

  test('regex metacharacters in contains are literal', () => {
    const { name } = compile({ key: 'name', op: 'contains', value: '.*' });
    expect(name.test('anything')).toBe(false);
    expect(name.test('a .* b')).toBe(true);
  });
});

describe('numeric operators', () => {
  test('gt, gte, lt and lte', () => {
    ['gt', 'gte', 'lt', 'lte'].forEach((op) => {
      expect(compile({ key: 'amount', op, value: 10 })).toEqual({ amount: { [`$${op}`]: 10 } });
    });
  });

  test('between is inclusive and allows open bounds', () => {
    expect(compile({ key: 'amount', op: 'between', value: [1, 10] })).toEqual({
      amount: { $gte: 1, $lte: 10 },
    });
    expect(compile({ key: 'amount', op: 'between', value: [null, 10] })).toEqual({
      amount: { $lte: 10 },
    });
    expect(compile({ key: 'amount', op: 'between', value: [1, null] })).toEqual({
      amount: { $gte: 1 },
    });
  });
});

describe('date operators', () => {
  const day = new Date('2026-03-01T00:00:00.000Z');
  const nextDay = new Date('2026-03-02T00:00:00.000Z');

  test('eq compares by day', () => {
    expect(compile({ key: 'created', op: 'eq', value: '2026-03-01T15:30:00.000Z' })).toEqual({
      created: { $gte: day, $lt: nextDay },
    });
    expect(compile({ key: 'updated', op: 'eq', value: '2026-03-01' })).toEqual({
      updated: { $gte: day, $lt: nextDay },
    });
  });

  test('ne excludes the day', () => {
    expect(compile({ key: 'created', op: 'ne', value: '2026-03-01' })).toEqual({
      created: { $not: { $gte: day, $lt: nextDay } },
    });
  });

  test('before and after on a date column compare whole days', () => {
    expect(compile({ key: 'created', op: 'before', value: '2026-03-01T10:00:00Z' })).toEqual({
      created: { $lt: day },
    });
    expect(compile({ key: 'created', op: 'after', value: '2026-03-01T10:00:00Z' })).toEqual({
      created: { $gte: nextDay },
    });
  });

  test('before and after on a datetime column compare instants', () => {
    const instant = new Date('2026-03-01T10:00:00Z');
    expect(compile({ key: 'updated', op: 'before', value: instant })).toEqual({
      updated: { $lt: instant },
    });
    expect(compile({ key: 'updated', op: 'after', value: instant })).toEqual({
      updated: { $gt: instant },
    });
  });

  test('between on a date column includes the whole end day', () => {
    expect(compile({ key: 'created', op: 'between', value: ['2026-02-01', '2026-03-01'] })).toEqual(
      {
        created: { $gte: new Date('2026-02-01T00:00:00.000Z'), $lt: nextDay },
      }
    );
  });

  test('between on a datetime column uses the instants', () => {
    const from = new Date('2026-02-01T08:00:00Z');
    const to = new Date('2026-03-01T08:00:00Z');
    expect(compile({ key: 'updated', op: 'between', value: [from, to] })).toEqual({
      updated: { $gte: from, $lte: to },
    });
  });

  test('within resolves relative ranges from now', () => {
    expect(compile({ key: 'created', op: 'within', value: { last: 7, unit: 'day' } })).toEqual({
      created: { $gte: new Date('2026-09-21T12:00:00.000Z'), $lte: now },
    });
    expect(compile({ key: 'created', op: 'within', value: { last: 2, unit: 'week' } })).toEqual({
      created: { $gte: new Date('2026-09-14T12:00:00.000Z'), $lte: now },
    });
    expect(compile({ key: 'created', op: 'within', value: { next: 1, unit: 'month' } })).toEqual({
      created: { $gte: now, $lte: new Date('2026-10-28T12:00:00.000Z') },
    });
    expect(compile({ key: 'created', op: 'within', value: { last: 1, unit: 'year' } })).toEqual({
      created: { $gte: new Date('2025-09-28T12:00:00.000Z'), $lte: now },
    });
  });
});

describe('boolean operators', () => {
  test('isTrue matches true and isFalse matches everything else', () => {
    expect(compile({ key: 'active', op: 'isTrue' })).toEqual({ active: true });
    expect(compile({ key: 'active', op: 'isFalse' })).toEqual({ active: { $ne: true } });
    expect(compile({ key: 'active', op: 'eq', value: false })).toEqual({ active: false });
  });
});

describe('array operators', () => {
  test('in is any of, nin is none of, contains has the value', () => {
    expect(compile({ key: 'tags', op: 'in', value: ['vip', 'new'] })).toEqual({
      tags: { $in: [/^vip$/i, /^new$/i] },
    });
    expect(compile({ key: 'tags', op: 'nin', value: ['vip'] })).toEqual({
      tags: { $nin: [/^vip$/i] },
    });
    expect(compile({ key: 'tags', op: 'contains', value: 'vip' })).toEqual({ tags: /^vip$/i });
  });

  test('notContains on an array field matches rows that do not have the value', () => {
    expect(compile({ key: 'tags', op: 'notContains', value: 'vip' })).toEqual({
      tags: { $not: /^vip$/i },
    });
    expect(compile({ key: 'tags', op: 'notContains', value: 5 })).toEqual({ tags: { $ne: 5 } });
  });
});

describe('avatar operators', () => {
  test('avatar fields filter like text on the value at their path', () => {
    expect(compile({ key: 'person', op: 'contains', value: 'ada' })).toEqual({
      'person.name': /ada/i,
    });
    expect(compile({ key: 'person', op: 'startsWith', value: 'a.' })).toEqual({
      'person.name': /^a\./i,
    });
    expect(compile({ key: 'person', op: 'eq', value: 'Ada' })).toEqual({ 'person.name': /^Ada$/i });
  });
});

describe('groups', () => {
  test('nested and/or compile to $and/$or', () => {
    expect(
      compile({
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
      $or: [{ stage: /^won$/i }, { $and: [{ amount: { $gte: 100 } }, { active: true }] }],
    });
  });

  test('a group with one child compiles to the child', () => {
    expect(compile({ and: [{ key: 'amount', op: 'gt', value: 1 }] })).toEqual({
      amount: { $gt: 1 },
    });
  });

  test('empty groups constrain nothing', () => {
    expect(compile({ and: [] })).toBe(null);
    expect(compile({ or: [{ and: [] }] })).toBe(null);
    expect(compile({ and: [{ or: [] }, { key: 'amount', op: 'gt', value: 1 }] })).toEqual({
      amount: { $gt: 1 },
    });
  });

  test('$user values compile to the resolved server value', () => {
    expect(compile({ key: 'owner', op: 'eq', value: { $user: 'id' } })).toEqual({
      'owner.id': /^user_1$/i,
    });
  });
});
