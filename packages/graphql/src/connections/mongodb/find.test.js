import mongodbFind from './find';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const query = { _id: 1 };

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'find';
const documents = [{ _id: 1 }, { _id: 2 }, { _id: 3 }];

const context = { ConfigurationError, RequestError };

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('find', async () => {
  const request = { query };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await mongodbFind({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
    },
  ]);
});

test('find options', async () => {
  const request = {
    query: { _id: { $gt: 1 } },
    options: { limit: 1, sort: [['id', 1]] },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await mongodbFind({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 2,
    },
  ]);
});

test('find no databaseUri', async () => {
  const request = { query };
  const connection = {
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('find databaseUri not a string', async () => {
  const request = { query };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('find no databaseName (optional)', async () => {
  const request = { query };
  const connection = {
    databaseUri,
    collection,
    read: true,
  };
  const res = await mongodbFind({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
    },
  ]);
});

test('find no collection', async () => {
  const request = { query };
  const connection = {
    databaseUri,
    databaseName,
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('find collection not a string', async () => {
  const request = { query };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('find no query', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Request query not specified'
  );
});

test('find connection error', async () => {
  const request = { query };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('find mongodb error', async () => {
  const request = { query: { x: { $badOp: 1 } } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'MongoError: unknown operator: $badOp'
  );
});

test('find read false', async () => {
  const request = { query };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: false,
  };
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(mongodbFind({ request, connection, context })).rejects.toThrow(
    'Connection does not allow reads'
  );
});

test('find read not specified', async () => {
  const request = { query };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  const res = await mongodbFind({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
    },
  ]);
});
