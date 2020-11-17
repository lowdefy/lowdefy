import mongodbAggregation from './aggregation';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const pipeline = [
  {
    $group: {
      _id: 1,
      c: { $sum: 1 },
    },
  },
];

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'aggregate';
const documents = [
  { _id: 1, date: new Date('2020-01-01') },
  { _id: 2, date: new Date('2020-02-01') },
  { _id: 3, date: new Date('2020-03-01') },
];

const context = { ConfigurationError, RequestError };

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('aggregation', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await mongodbAggregation({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
      c: 3,
    },
  ]);
});

test('aggregation no databaseUri', async () => {
  const request = { pipeline };
  const connection = {
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('aggregation databaseUri not a string', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('aggregation no databaseName (optional)', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    collection,
    read: true,
  };
  const res = await mongodbAggregation({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
      c: 3,
    },
  ]);
});

test('aggregation no collection', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    databaseName,
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('aggregation collection not a string', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('aggregation no pipeline', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Request aggregation pipeline not specified'
  );
});

test('aggregation connection error', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('aggregation mongodb error', async () => {
  const request = { pipeline: [{ $badStage: { a: 1 } }] };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    "Unrecognized pipeline stage name: '$badStage'"
  );
});

test('aggregation read false', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: false,
  };
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbAggregation({ request, connection, context })).rejects.toThrow(
    'Connection does not allow reads'
  );
});

test('aggregation read not specified', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  const res = await mongodbAggregation({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
      c: 3,
    },
  ]);
});

test('aggregation match dates', async () => {
  const request = {
    pipeline: [
      {
        $match: {
          date: { $gt: { _date: '2020-01-15' } },
        },
      },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await mongodbAggregation({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 2,
      date: { _date: 1580515200000 },
    },
    {
      _id: 3,
      date: { _date: 1583020800000 },
    },
  ]);
});
