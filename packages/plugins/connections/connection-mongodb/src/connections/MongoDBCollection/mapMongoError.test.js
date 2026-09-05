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

import { ConfigError, ServiceError } from '@lowdefy/errors';

import mapMongoError from './mapMongoError.js';

const connection = { collection: 'orders', databaseName: 'app' };

function driverError({ code, message = 'raw driver text', name = 'MongoServerError', ...rest }) {
  const error = new Error(message);
  error.name = name;
  error.code = code;
  Object.assign(error, rest);
  return error;
}

test('mapMongoError maps a duplicate key error to a ServiceError naming the indexed fields', () => {
  const cause = driverError({
    code: 11000,
    message:
      'E11000 duplicate key error collection: app.orders index: orders_ref_1 dup key: { ref: "ORD-1" }',
    keyPattern: { ref: 1 },
    keyValue: { ref: 'ORD-1' },
  });
  const mapped = mapMongoError(cause, { connection, requestType: 'MongoDBInsertOne' });
  expect(mapped).toBeInstanceOf(ServiceError);
  expect(mapped.name).toBe('ServiceError');
  expect(mapped.message).toBe('MongoDB: Duplicate key on collection "orders".');
  expect(mapped.code).toBe(11000);
  expect(mapped.service).toBe('MongoDB');
  expect(mapped.hint).toBe(
    'A unique index on ref already has a document with these values. Insert with MongoDBUpdateOne and upsert: true, or remove the existing document first.'
  );
  expect(mapped.cause).toBe(cause);
});

test('mapMongoError never quotes the driver message or the caller values in a duplicate key error', () => {
  const mapped = mapMongoError(
    driverError({
      code: 11000,
      message: 'E11000 duplicate key error dup key: { ref: "ORD-1" }',
      keyPattern: { ref: 1, org: 1 },
      keyValue: { ref: 'ORD-1', org: 'acme' },
    }),
    { connection, requestType: 'MongoDBInsertOne' }
  );
  expect(mapped.message).not.toContain('ORD-1');
  expect(mapped.hint).not.toContain('ORD-1');
  expect(mapped.hint).not.toContain('acme');
  expect(mapped.hint).toContain('A unique index on ref, org');
});

test('mapMongoError maps a duplicate key error without a keyPattern', () => {
  const mapped = mapMongoError(driverError({ code: 11001 }), {
    connection,
    requestType: 'MongoDBUpdateOne',
  });
  expect(mapped.code).toBe(11001);
  expect(mapped.hint).toContain('A unique index on the index');
});

test.each([2, 9, 16, 40323])('mapMongoError maps code %s to a malformed command error', (code) => {
  const mapped = mapMongoError(driverError({ code }), {
    connection,
    requestType: 'MongoDBAggregation',
  });
  expect(mapped.message).toBe(
    'MongoDB: MongoDB rejected the MongoDBAggregation command on collection "orders" as malformed.'
  );
  expect(mapped.hint).toBe(
    'A pipeline stage object must contain exactly one operator key, and every operator must be spelled with its leading $. Check the stage the message names.'
  );
});

test.each([31254, 40415])('mapMongoError maps code %s to an unknown field error', (code) => {
  const mapped = mapMongoError(driverError({ code }), {
    connection,
    requestType: 'MongoDBFind',
  });
  expect(mapped.message).toBe(
    'MongoDB: MongoDB rejected an unknown field in the MongoDBFind command on collection "orders".'
  );
  expect(mapped.hint).toContain('Remove the field or check its spelling');
});

test.each([13, 18])('mapMongoError maps code %s to a not authorized error', (code) => {
  const mapped = mapMongoError(driverError({ code }), {
    connection,
    requestType: 'MongoDBDeleteMany',
  });
  expect(mapped.message).toBe(
    'MongoDB: Not authorized to run MongoDBDeleteMany on collection "orders".'
  );
  expect(mapped.hint).toContain('does not have permission for this operation');
});

test('mapMongoError maps code 26 to a missing collection error', () => {
  const mapped = mapMongoError(driverError({ code: 26 }), {
    connection,
    requestType: 'MongoDBFind',
  });
  expect(mapped.message).toBe('MongoDB: Collection "orders" does not exist.');
  expect(mapped.hint).toContain("Check the connection's properties.collection");
});

test.each([50, 89])('mapMongoError maps code %s to a time limit error', (code) => {
  const mapped = mapMongoError(driverError({ code }), {
    connection,
    requestType: 'MongoDBFind',
  });
  expect(mapped.message).toBe(
    'MongoDB: The MongoDBFind on collection "orders" exceeded its time limit.'
  );
  expect(mapped.hint).toContain('Add an index covering the filter and sort fields');
});

test('mapMongoError maps code 292 to a memory limit error', () => {
  const mapped = mapMongoError(driverError({ code: 292 }), {
    connection,
    requestType: 'MongoDBAggregation',
  });
  expect(mapped.message).toBe(
    'MongoDB: The aggregation on collection "orders" exceeded MongoDB\'s memory limit.'
  );
  expect(mapped.hint).toContain('allowDiskUse: true');
});

test('mapMongoError maps an unlisted code to a generic error naming the code', () => {
  const mapped = mapMongoError(driverError({ code: 123456 }), {
    connection,
    requestType: 'MongoDBUpdateMany',
  });
  expect(mapped.message).toBe(
    'MongoDB: MongoDB rejected the MongoDBUpdateMany on collection "orders" (code 123456).'
  );
  expect(mapped.hint).toContain('Look up the code in the MongoDB error reference');
});

test('mapMongoError maps a MongoError as well as a MongoServerError', () => {
  const mapped = mapMongoError(driverError({ code: 26, name: 'MongoError' }), {
    connection,
    requestType: 'MongoDBFind',
  });
  expect(mapped).toBeInstanceOf(ServiceError);
});

test('mapMongoError returns a service error unchanged', () => {
  const error = driverError({ code: 'ECONNREFUSED', name: 'MongoNetworkError' });
  expect(mapMongoError(error, { connection, requestType: 'MongoDBFind' })).toBe(error);
});

test('mapMongoError returns a ConfigError unchanged', () => {
  const error = new ConfigError('Connection does not allow writes.');
  expect(mapMongoError(error, { connection, requestType: 'MongoDBAggregation' })).toBe(error);
});

test('mapMongoError returns a plain Error unchanged', () => {
  const error = new Error('No matching record to update.');
  expect(mapMongoError(error, { connection, requestType: 'MongoDBUpdateOne' })).toBe(error);
});

test('mapMongoError falls back to "unknown" when the connection has no collection name', () => {
  const mapped = mapMongoError(driverError({ code: 26 }), {
    connection: {},
    requestType: 'MongoDBFind',
  });
  expect(mapped.message).toBe('MongoDB: Collection "unknown" does not exist.');
});
