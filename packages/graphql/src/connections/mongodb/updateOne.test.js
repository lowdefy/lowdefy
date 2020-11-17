import mongodbUpdateOne from './updateOne';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'updateOne';
const documents = [
  { _id: 'updateOne', v: 'before' },
  { _id: 'updateOne_no_databaseUri', v: 'before' },
  { _id: 'updateOne_databaseUri_not_a_string', v: 'before' },
  { _id: 'updateOne_no_databaseName', v: 'before' },
  { _id: 'updateOne_no_collection', v: 'before' },
  { _id: 'updateOne_collection_not_a_string', v: 'before' },
  { _id: 'updateOne_no_update', v: 'before' },
  { _id: 'updateOne_connection_error', v: 'before' },
  { _id: 'updateOne_mongodb_error', v: 'before' },
  { _id: 'updateOne_write_false', v: 'before' },
  { _id: 'updateOne_write_not_specified', v: 'before' },
];

const context = { ConfigurationError, RequestError };

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('updateOne', async () => {
  const request = {
    filter: { _id: 'updateOne' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateOne({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
  });
});

test('updateOne upsert', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert' },
    update: { $set: { v: 'after' } },
    options: { upsert: true },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateOne({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: {
      _id: 'updateOne_upsert',
      index: 0,
    },
    upsertedCount: 1,
    matchedCount: 0,
  });
});

test('updateOne upsert false', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_false' },
    update: { $set: { v: 'after' } },
    options: { upsert: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateOne({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
});

test('updateOne upsert default false', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_default_false' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateOne({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
});

test('updateOne no databaseUri', async () => {
  const request = { filter: { _id: 'updateOne_no_databaseUri' }, update: { $set: { v: 'after' } } };
  const connection = {
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('updateOne databaseUri not a string', async () => {
  const request = {
    filter: { _id: 'updateOne_databaseUri_not_a_string' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('updateOne no databaseName (optional)', async () => {
  const request = {
    filter: { _id: 'updateOne_no_databaseName' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    collection,
    write: true,
  };
  const res = await mongodbUpdateOne({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
  });
});

test('updateOne no collection', async () => {
  const request = { filter: { _id: 'updateOne_no_collection' }, update: { $set: { v: 'after' } } };
  const connection = {
    databaseUri,
    databaseName,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('updateOne collection not a string', async () => {
  const request = {
    filter: { _id: 'updateOne_collection_not_a_string' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('updateOne no update', async () => {
  const request = {
    filter: { _id: 'updateOne_no_update' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Request update not specified'
  );
});

test('updateOne no filter', async () => {
  const request = {
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Request filter not specified'
  );
});

test('updateOne connection error', async () => {
  const request = {
    filter: { _id: 'updateOne_connection_error' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('updateOne mongodb error', async () => {
  const request = {
    filter: { _id: 'updateOne_mongodb_error' },
    update: { $badOp: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'MongoError: Unknown modifier: $badOp'
  );
});

test('updateOne write false', async () => {
  const request = { filter: { _id: 'updateOne_write_false' }, update: { $set: { v: 'after' } } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('updateOne write not specified', async () => {
  const request = {
    filter: { _id: 'updateOne_write_not_specified' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});
