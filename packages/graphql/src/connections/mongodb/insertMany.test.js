import mongodbInsertMany from './insertMany';
import clearTestMongoDb from '../../test/clearTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertMany';

const context = { ConfigurationError, RequestError };

beforeAll(() => {
  return clearTestMongoDb({ collection });
});

test('insertMany', async () => {
  const request = {
    docs: [{ _id: 'insertMany1-1' }, { _id: 'insertMany1-2' }, { _id: 'insertMany1-3' }],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbInsertMany({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 3,
    ops: [
      {
        _id: 'insertMany1-1',
      },
      {
        _id: 'insertMany1-2',
      },
      {
        _id: 'insertMany1-3',
      },
    ],
  });
});

test('insertMany options', async () => {
  const request = {
    docs: [{ _id: 'insertMany2-1' }, { _id: 'insertMany2-2' }],
    options: { w: 'majority' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbInsertMany({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 2,
    ops: [
      {
        _id: 'insertMany2-1',
      },
      {
        _id: 'insertMany2-2',
      },
    ],
  });
});

test('insertMany no databaseUri', async () => {
  const request = {
    docs: [{ _id: 'insertMany3-1' }, { _id: 'insertMany3-2' }],
  };
  const connection = {
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('insertMany databaseUri not a string', async () => {
  const request = { docs: [{ _id: 'insertMany4-1' }, { _id: 'insertMany4-2' }] };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('insertMany no databaseName (optional)', async () => {
  const request = { docs: [{ _id: 'insertMany5-1' }, { _id: 'insertMany5-2' }] };
  const connection = {
    databaseUri,
    collection,
    write: true,
  };
  const res = await mongodbInsertMany({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 2,
    ops: [
      {
        _id: 'insertMany5-1',
      },
      {
        _id: 'insertMany5-2',
      },
    ],
  });
});

test('insertMany no collection', async () => {
  const request = { docs: [{ _id: 'insertMany6-1' }, { _id: 'insertMany6-2' }] };
  const connection = {
    databaseUri,
    databaseName,
    write: true,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('insertMany collection not a string', async () => {
  const request = { docs: [{ _id: 'insertMany7-1' }, { _id: 'insertMany7-2' }] };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    write: true,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('insertMany no docs', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Request docs not specified'
  );
});

test('insertMany connection error', async () => {
  const request = { docs: [{ _id: 'insertMany8-1' }, { _id: 'insertMany8-2' }] };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('insertMany mongodb error', async () => {
  const request = { docs: [{ _id: 'insertMany9-1' }, { _id: 'insertMany9-2' }] };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await mongodbInsertMany({ request, connection, context });
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'BulkWriteError: E11000 duplicate key error dup key: { : "insertMany9-1" }'
  );
});

test('insertMany write false', async () => {
  const request = { docs: [{ _id: 'insertMany10-1' }, { _id: 'insertMany10-2' }] };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('insertMany write not specified', async () => {
  const request = { docs: [{ _id: 'insertMany11-1' }, { _id: 'insertMany11-2' }] };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbInsertMany({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});
