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

import { jest } from '@jest/globals';
import { ObjectId } from 'mongodb';

import createCustomAdapter from './createCustomAdapter.js';

const schema = {
  member: {
    fields: {
      organizationId: { references: { field: 'id' } },
      role: {},
      email: {},
    },
  },
  organization: {
    fields: {
      slug: { unique: true },
    },
  },
};

function setup({ collectionMethods = {} } = {}) {
  const aggregateToArray = jest.fn().mockResolvedValue([]);
  const collection = {
    insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    aggregate: jest.fn(() => ({ toArray: aggregateToArray })),
    findOneAndUpdate: jest.fn().mockResolvedValue({ value: null }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    deleteOne: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    findOneAndDelete: jest.fn().mockResolvedValue({ value: null }),
    ...collectionMethods,
  };
  const db = { collection: jest.fn(() => collection) };
  const customAdapter = createCustomAdapter({ db })({
    getFieldAttributes: ({ model, field }) => schema[model].fields[field] ?? {},
    getFieldName: ({ field }) => field,
    schema,
    getDefaultModelName: (model) => model,
    options: {},
  });
  return { customAdapter, collection, db, aggregateToArray };
}

test('create inserts the document and returns it with a string _id', async () => {
  const { customAdapter, collection } = setup();
  const insertedId = new ObjectId();
  collection.insertOne.mockResolvedValue({ insertedId });
  const result = await customAdapter.create({
    model: 'member',
    data: { role: 'admin' },
  });
  expect(collection.insertOne).toHaveBeenCalledWith({ role: 'admin' });
  expect(result).toEqual({ _id: insertedId.toString(), role: 'admin' });
});

test('findOne matches on the converted where clause and limits to one document', async () => {
  const { customAdapter, collection, aggregateToArray } = setup();
  aggregateToArray.mockResolvedValue([{ role: 'admin' }]);
  const result = await customAdapter.findOne({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
  });
  expect(collection.aggregate).toHaveBeenCalledWith([
    { $match: { role: 'admin' } },
    { $limit: 1 },
  ]);
  expect(result).toEqual({ role: 'admin' });
});

test('findOne returns null when no document matches', async () => {
  const { customAdapter } = setup();
  const result = await customAdapter.findOne({
    model: 'member',
    where: [{ field: 'role', value: 'nobody' }],
  });
  expect(result).toBeNull();
});

test('findOne projects selected fields', async () => {
  const { customAdapter, collection } = setup();
  await customAdapter.findOne({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
    select: ['email'],
  });
  expect(collection.aggregate).toHaveBeenCalledWith([
    { $match: { role: 'admin' } },
    { $project: { email: 1 } },
    { $limit: 1 },
  ]);
});

test('findMany applies sort, offset, and limit stages in order', async () => {
  const { customAdapter, collection } = setup();
  await customAdapter.findMany({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
    sortBy: { field: 'email', direction: 'desc' },
    offset: 10,
    limit: 5,
  });
  expect(collection.aggregate).toHaveBeenCalledWith([
    { $match: { role: 'admin' } },
    { $sort: { email: -1 } },
    { $skip: 10 },
    { $limit: 5 },
  ]);
});

test('findMany matches everything when where is omitted', async () => {
  const { customAdapter, collection } = setup();
  await customAdapter.findMany({ model: 'member' });
  expect(collection.aggregate).toHaveBeenCalledWith([{ $match: {} }]);
});

test('findOne joins a unique foreign model with lookup and unwind', async () => {
  const { customAdapter, collection } = setup();
  await customAdapter.findOne({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
    join: { organization: { on: { from: 'organizationId', to: 'slug' } } },
  });
  expect(collection.aggregate).toHaveBeenCalledWith([
    { $match: { role: 'admin' } },
    {
      $lookup: {
        from: 'organization',
        localField: 'organizationId',
        foreignField: 'slug',
        as: 'organization',
      },
    },
    { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } },
    { $limit: 1 },
  ]);
});

test('count returns the aggregate total and zero for no matches', async () => {
  const { customAdapter, collection, aggregateToArray } = setup();
  aggregateToArray.mockResolvedValue([{ total: 3 }]);
  const total = await customAdapter.count({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
  });
  expect(collection.aggregate).toHaveBeenCalledWith([
    { $match: { role: 'admin' } },
    { $count: 'total' },
  ]);
  expect(total).toEqual(3);
  aggregateToArray.mockResolvedValue([]);
  expect(await customAdapter.count({ model: 'member' })).toEqual(0);
});

test('update sets values and returns the updated document', async () => {
  const { customAdapter, collection } = setup();
  collection.findOneAndUpdate.mockResolvedValue({ value: { role: 'owner' } });
  const result = await customAdapter.update({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
    update: { role: 'owner' },
  });
  expect(collection.findOneAndUpdate).toHaveBeenCalledWith(
    { role: 'admin' },
    { $set: { role: 'owner' } },
    { returnDocument: 'after', includeResultMetadata: true }
  );
  expect(result).toEqual({ role: 'owner' });
});

test('update returns null when no document matches', async () => {
  const { customAdapter } = setup();
  const result = await customAdapter.update({
    model: 'member',
    where: [{ field: 'role', value: 'nobody' }],
    update: { role: 'owner' },
  });
  expect(result).toBeNull();
});

test('updateMany and deleteMany return affected counts', async () => {
  const { customAdapter, collection } = setup();
  collection.updateMany.mockResolvedValue({ modifiedCount: 2 });
  collection.deleteMany.mockResolvedValue({ deletedCount: 4 });
  expect(
    await customAdapter.updateMany({
      model: 'member',
      where: [{ field: 'role', value: 'admin' }],
      update: { role: 'owner' },
    })
  ).toEqual(2);
  expect(
    await customAdapter.deleteMany({
      model: 'member',
      where: [{ field: 'role', value: 'guest' }],
    })
  ).toEqual(4);
});

test('delete removes a single matching document', async () => {
  const { customAdapter, collection } = setup();
  await customAdapter.delete({
    model: 'member',
    where: [{ field: 'role', value: 'guest' }],
  });
  expect(collection.deleteOne).toHaveBeenCalledWith({ role: 'guest' });
});

test('consumeOne deletes and returns the consumed document', async () => {
  const { customAdapter, collection } = setup();
  collection.findOneAndDelete.mockResolvedValue({ value: { role: 'admin' } });
  const result = await customAdapter.consumeOne({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
  });
  expect(collection.findOneAndDelete).toHaveBeenCalledWith(
    { role: 'admin' },
    { includeResultMetadata: true }
  );
  expect(result).toEqual({ role: 'admin' });
});

test('incrementOne applies increments and optional sets', async () => {
  const { customAdapter, collection } = setup();
  collection.findOneAndUpdate.mockResolvedValue({ value: { count: 2 } });
  const result = await customAdapter.incrementOne({
    model: 'member',
    where: [{ field: 'role', value: 'admin' }],
    increment: { count: 1 },
    set: { updatedAt: 'now' },
  });
  expect(collection.findOneAndUpdate).toHaveBeenCalledWith(
    { role: 'admin' },
    { $inc: { count: 1 }, $set: { updatedAt: 'now' } },
    { returnDocument: 'after', includeResultMetadata: true }
  );
  expect(result).toEqual({ count: 2 });
});
