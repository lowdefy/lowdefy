/*
  Copyright 2020 Lowdefy, Inc

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

import MongoDBAggregation from './MongoDBAggregation';
import populateTestMongoDb from '../../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../../context/errors';
import testSchema from '../../../utils/testSchema';

const { resolver, schema } = MongoDBAggregation;

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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual([
    {
      _id: 1,
      c: 3,
    },
  ]);
});

test('aggregation connection error', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    read: true,
  };
  await expect(resolver({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
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
  await expect(resolver({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
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
  await expect(resolver({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'MongoDBCollection connection does not allow reads.'
  );
});

test('aggregation read not specified', async () => {
  const request = { pipeline };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  const res = await resolver({ request, connection, context });
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
  const res = await resolver({ request, connection, context });
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

test('request not an object', async () => {
  const request = 'request';
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBAggregation request properties should be an object.'
  );
});

test('aggregation no pipeline', async () => {
  const request = {};
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBAggregation request should have required property "pipeline".'
  );
});

test('aggregation pipeline not an array', async () => {
  const request = { pipeline: 'pipeline' };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBAggregation request property "pipeline" should be an array.'
  );
});

test('aggregation options not an object', async () => {
  const request = { pipeline, options: 'options' };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBAggregation request property "options" should be an object.'
  );
});
