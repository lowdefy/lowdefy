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

import createConvertWhereClause from './createConvertWhereClause.js';
import createSerializeId from './createSerializeId.js';

const schema = {
  member: {
    fields: {
      organizationId: { references: { field: 'id' } },
      role: {},
      email: {},
    },
  },
};

function setup() {
  const serializeId = createSerializeId({
    customIdGenerator: undefined,
    getDefaultModelName: (model) => model,
    schema,
    useUUIDs: false,
  });
  return createConvertWhereClause({
    getFieldAttributes: ({ model, field }) => schema[model].fields[field] ?? {},
    getFieldName: ({ field }) => field,
    serializeId,
  });
}

test('convertWhereClause returns an empty filter for an empty where array', () => {
  const convertWhereClause = setup();
  expect(convertWhereClause({ model: 'member', where: [] })).toEqual({});
});

test('convertWhereClause maps id to _id and coerces the value to ObjectId', () => {
  const convertWhereClause = setup();
  const hex = new ObjectId().toHexString();
  const clause = convertWhereClause({
    model: 'member',
    where: [{ field: 'id', value: hex }],
  });
  expect(clause._id).toBeInstanceOf(ObjectId);
  expect(clause._id.toHexString()).toEqual(hex);
});

test('convertWhereClause coerces id reference fields to ObjectId', () => {
  const convertWhereClause = setup();
  const hex = new ObjectId().toHexString();
  const clause = convertWhereClause({
    model: 'member',
    where: [{ field: 'organizationId', value: hex }],
  });
  expect(clause.organizationId).toBeInstanceOf(ObjectId);
});

test('convertWhereClause supports comparison and set operators', () => {
  const convertWhereClause = setup();
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'role', value: ['admin', 'owner'], operator: 'in' }],
    })
  ).toEqual({ role: { $in: ['admin', 'owner'] } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'role', value: ['guest'], operator: 'not_in' }],
    })
  ).toEqual({ role: { $nin: ['guest'] } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'role', value: 5, operator: 'gt' }],
    })
  ).toEqual({ role: { $gt: 5 } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'role', value: 5, operator: 'lte' }],
    })
  ).toEqual({ role: { $lte: 5 } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'role', value: 'admin', operator: 'ne' }],
    })
  ).toEqual({ role: { $ne: 'admin' } });
});

test('convertWhereClause builds escaped regexes for string match operators', () => {
  const convertWhereClause = setup();
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'email', value: 'a.b', operator: 'contains' }],
    })
  ).toEqual({ email: { $regex: '.*a\\.b.*' } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'email', value: 'a.b', operator: 'starts_with' }],
    })
  ).toEqual({ email: { $regex: '^a\\.b' } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'email', value: 'a.b', operator: 'ends_with' }],
    })
  ).toEqual({ email: { $regex: 'a\\.b$' } });
});

test('convertWhereClause builds case-insensitive conditions in insensitive mode', () => {
  const convertWhereClause = setup();
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'email', value: 'User@Example.COM', mode: 'insensitive' }],
    })
  ).toEqual({ email: { $regex: '^User@Example\\.COM$', $options: 'i' } });
  expect(
    convertWhereClause({
      model: 'member',
      where: [{ field: 'email', value: [], operator: 'in', mode: 'insensitive' }],
    })
  ).toEqual({ $expr: { $eq: [1, 0] } });
});

test('convertWhereClause never applies insensitive matching to id fields', () => {
  const convertWhereClause = setup();
  const hex = new ObjectId().toHexString();
  const clause = convertWhereClause({
    model: 'member',
    where: [{ field: 'id', value: hex, mode: 'insensitive' }],
  });
  expect(clause._id).toBeInstanceOf(ObjectId);
});

test('convertWhereClause combines conditions with AND and OR connectors', () => {
  const convertWhereClause = setup();
  const clause = convertWhereClause({
    model: 'member',
    where: [
      { field: 'role', value: 'admin' },
      { field: 'email', value: 'a@b.c', connector: 'OR' },
      { field: 'role', value: 'guest', operator: 'ne' },
    ],
  });
  expect(clause).toEqual({
    $and: [{ role: 'admin' }, { role: { $ne: 'guest' } }],
    $or: [{ email: 'a@b.c' }],
  });
});

test('convertWhereClause throws on unsupported operators', () => {
  const convertWhereClause = setup();
  expect(() =>
    convertWhereClause({
      model: 'member',
      where: [{ field: 'role', value: 'admin', operator: 'like' }],
    })
  ).toThrow('MongoDB auth adapter received an unsupported where operator.');
});

test('serializeId throws on non-string non-id values for id fields', () => {
  const serializeId = createSerializeId({
    customIdGenerator: undefined,
    getDefaultModelName: (model) => model,
    schema,
    useUUIDs: false,
  });
  expect(() => serializeId({ field: '_id', model: 'member', value: 42 })).toThrow(
    'MongoDB auth adapter received an invalid id value.'
  );
});

test('serializeId skips coercion when a custom id generator is configured', () => {
  const serializeId = createSerializeId({
    customIdGenerator: () => 'custom',
    getDefaultModelName: (model) => model,
    schema,
    useUUIDs: false,
  });
  expect(serializeId({ field: '_id', model: 'member', value: 'plain-string-id' })).toEqual(
    'plain-string-id'
  );
});

test('serializeId coerces arrays of id strings and passes null through', () => {
  const serializeId = createSerializeId({
    customIdGenerator: undefined,
    getDefaultModelName: (model) => model,
    schema,
    useUUIDs: false,
  });
  const hex = new ObjectId().toHexString();
  const result = serializeId({ field: '_id', model: 'member', value: [hex, null] });
  expect(result[0]).toBeInstanceOf(ObjectId);
  expect(result[1]).toBeNull();
  expect(serializeId({ field: '_id', model: 'member', value: null })).toBeNull();
});
