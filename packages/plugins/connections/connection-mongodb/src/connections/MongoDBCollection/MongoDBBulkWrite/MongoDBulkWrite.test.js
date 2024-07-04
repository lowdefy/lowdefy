/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { validate } from '@lowdefy/ajv';
import MongoDBBulkWrite from './MongoDBBulkWrite.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBBulkWrite.meta;
const schema = MongoDBBulkWrite.schema;

const operations = [{}];

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'bulkWrite';
const documents = [
  { _id: 'deleteMany' },
  { _id: 'deleteMany_1' },
  { _id: 'deleteMany_2' },
  { _id: 'deleteMany_3' },
  { _id: 'deleteMany_4', f: 'deleteMany' },
  { _id: 'deleteMany_5', f: 'deleteMany' },
  { _id: 'deleteMany_6', f: 'deleteMany' },
  { _id: 'deleteOne' },
  { _id: 'updateMany', v: 'before' },
  { _id: 'updateMany_1', v: 'before' },
  { _id: 'updateMany_2', v: 'before' },
  { _id: 'updateMany_3', v: 'before' },
  { _id: 'updateMany_4', v: 'before', f: 'updateMany' },
  { _id: 'updateMany_5', v: 'before', f: 'updateMany' },
  { _id: 'updateMany_6', v: 'before', f: 'updateMany' },
  { _id: 'updateOne', v: 'before' },
  { _id: 'replaceOne', v: 'before' },
];

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('bulkWrite connection error', async () => {
  const request = { operations };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    read: true,
  };
  await expect(MongoDBBulkWrite({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('request not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBBulkWrite request properties should be an object.'
  );
});

test('bulkWrite no operations', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBBulkWrite request should have required property "operations".'
  );
});

test('bulkWrite operations not an array of objects', async () => {
  const request = { operations: 'operations' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBBulkWrite request property "operations" should be an array.'
  );
});

test('bulkWrite operations not an array', async () => {
  const request = { operations: ['operations'] };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBBulkWrite request property "operations" should be an array of write operation objects.'
  );
});

test('bulkWrite operation not a valid write operation', async () => {
  const request = { operations: [{ notValidOperation: 'notValidOperation' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBBulkWrite operation should be a write operation.'
  );
});

test('bulkWrite options not an object', async () => {
  const request = { operations, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBBulkWrite request property "options" should be an object.'
  );
});

test('insertOne operation not an object', async () => {
  const request = { operations: [{ insertOne: 'insertOne' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'insertOne operation should be an object.'
  );
});

test('insertOne operation document not an object', async () => {
  const request = { operations: [{ insertOne: { document: 'document' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'insertOne operation property "document" should be an object.'
  );
});

test('insertOne operation no document', async () => {
  const request = { operations: [{ insertOne: { property: 'property' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'insertOne operation should have required property "document".'
  );
});

test('updateOne operation not an object', async () => {
  const request = { operations: [{ updateOne: 'updateOne' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateOne operation should be an object.'
  );
});

test('updateOne operation filter not an object', async () => {
  const request = { operations: [{ updateOne: { filter: 'filter' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateOne operation property "filter" should be an object.'
  );
});

test('updateOne operation update not an object', async () => {
  const request = { operations: [{ updateOne: { filter: { _id: 1 }, update: 'update' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateOne operation property "update" should be an object or an array.'
  );
});

test('updateOne operation no filter', async () => {
  const request = { operations: [{ updateOne: { property: 'property' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateOne operation should have required property "filter".'
  );
});

test('updateOne operation no update', async () => {
  const request = { operations: [{ updateOne: { filter: { _id: 1 } } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateOne operation should have required property "update".'
  );
});

test('updateMany operation not an object', async () => {
  const request = { operations: [{ updateMany: 'updateMany' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateMany operation should be an object.'
  );
});

test('updateMany operation filter not an object', async () => {
  const request = { operations: [{ updateMany: { filter: 'filter' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateMany operation property "filter" should be an object.'
  );
});

test('updateMany operation update not an object', async () => {
  const request = { operations: [{ updateMany: { filter: { _id: 1 }, update: 'update' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateMany operation property "update" should be an object or an array.'
  );
});

test('updateMany operation no filter', async () => {
  const request = { operations: [{ updateMany: { property: 'property' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateMany operation should have required property "filter".'
  );
});

test('updateMany operation no update', async () => {
  const request = { operations: [{ updateMany: { filter: { _id: 1 } } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'updateMany operation should have required property "update".'
  );
});

test('deleteOne operation not an object', async () => {
  const request = { operations: [{ deleteOne: 'deleteOne' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'deleteOne operation should be an object.'
  );
});

test('deleteOne operation filter not an object', async () => {
  const request = { operations: [{ deleteOne: { filter: 'filter' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'deleteOne operation property "filter" should be an object.'
  );
});

test('deleteOne operation no filter', async () => {
  const request = { operations: [{ deleteOne: { property: 'property' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'deleteOne operation should have required property "filter".'
  );
});

test('deleteMany operation not an object', async () => {
  const request = { operations: [{ deleteMany: 'deleteMany' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'deleteMany operation should be an object.'
  );
});

test('deleteMany operation filter not an object', async () => {
  const request = { operations: [{ deleteMany: { filter: 'filter' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'deleteMany operation property "filter" should be an object.'
  );
});

test('deleteMany operation no filter', async () => {
  const request = { operations: [{ deleteMany: { property: 'property' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'deleteMany operation should have required property "filter".'
  );
});

test('replaceOne operation not an object', async () => {
  const request = { operations: [{ replaceOne: 'replaceOne' }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'replaceOne operation should be an object.'
  );
});

test('replaceOne operation filter not an object', async () => {
  const request = { operations: [{ replaceOne: { filter: 'filter' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'replaceOne operation property "filter" should be an object.'
  );
});

test('replaceOne operation update not an object', async () => {
  const request = {
    operations: [{ replaceOne: { filter: { _id: 1 }, replacement: 'replacement' } }],
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'replaceOne operation property "replacement" should be an object.'
  );
});

test('replaceOne operation no filter', async () => {
  const request = { operations: [{ replaceOne: { property: 'property' } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'replaceOne operation should have required property "filter".'
  );
});

test('replaceOne operation no replacement', async () => {
  const request = { operations: [{ replaceOne: { filter: { _id: 1 } } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'replaceOne operation should have required property "replacement".'
  );
});

test('insertOne', async () => {
  const request = { operations: [{ insertOne: { document: { _id: 'insertOne' } } }] };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 1,
    insertedIds: { 0: 'insertOne' },
    matchedCount: 0,
    modifiedCount: 0,
    deletedCount: 0,
    upsertedCount: 0,
    upsertedIds: {},
  });
});

test('deleteMany', async () => {
  const request = {
    operations: [
      {
        deleteMany: { filter: { _id: { $in: ['deleteMany_1', 'deleteMany_2', 'deleteMany_3'] } } },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 0,
    insertedIds: {},
    matchedCount: 0,
    modifiedCount: 0,
    deletedCount: 3,
    upsertedCount: 0,
    upsertedIds: {},
  });
});

test('deleteOne', async () => {
  const request = {
    operations: [
      {
        deleteOne: {
          filter: { _id: 'deleteOne' },
        },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 0,
    insertedIds: {},
    matchedCount: 0,
    modifiedCount: 0,
    deletedCount: 1,
    upsertedCount: 0,
    upsertedIds: {},
  });
});

test('updateMany - Multiple Documents', async () => {
  const request = {
    operations: [
      {
        updateMany: {
          filter: { _id: { $in: ['updateMany_1', 'updateMany_2', 'updateMany_3'] } },
          update: { $set: { v: 'after' } },
        },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 0,
    insertedIds: {},
    matchedCount: 3,
    modifiedCount: 3,
    deletedCount: 0,
    upsertedCount: 0,
    upsertedIds: {},
  });
});

test('updateOne', async () => {
  const request = {
    operations: [
      {
        updateOne: {
          filter: { _id: 'updateOne' },
          update: { $set: { v: 'after' } },
        },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 0,
    insertedIds: {},
    matchedCount: 1,
    modifiedCount: 1,
    deletedCount: 0,
    upsertedCount: 0,
    upsertedIds: {},
  });
});

test('updateOne upsert', async () => {
  const request = {
    operations: [
      {
        updateOne: {
          filter: { _id: 'updateOne_upsert' },
          update: { $set: { v: 'after' } },
          upsert: true,
        },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 0,
    insertedIds: {},
    matchedCount: 0,
    modifiedCount: 0,
    deletedCount: 0,
    upsertedCount: 1,
    upsertedIds: { 0: 'updateOne_upsert' },
  });
});

test('replaceOne', async () => {
  const request = {
    operations: [
      {
        replaceOne: {
          filter: { _id: 'replaceOne' },
          replacement: { v: 'after' },
        },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBBulkWrite({ request, connection });
  expect(res).toEqual({
    insertedCount: 0,
    insertedIds: {},
    matchedCount: 1,
    modifiedCount: 1,
    deletedCount: 0,
    upsertedCount: 0,
    upsertedIds: {},
  });
});
