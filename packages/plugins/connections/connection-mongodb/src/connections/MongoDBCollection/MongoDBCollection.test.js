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
import MongoDBCollection from './MongoDBCollection.js';

const schema = MongoDBCollection.schema;

test('All requests are present', () => {
  expect(MongoDBCollection.requests.MongoDBAggregation).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBBulkWrite).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBDeleteMany).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBDeleteOne).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBFind).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBFindOne).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBInsertMany).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBInsertOne).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBUpdateMany).toBeDefined();
  expect(MongoDBCollection.requests.MongoDBUpdateOne).toBeDefined();
});

test('valid connection schema', () => {
  const connection = {
    databaseUri: 'databaseUri',
    collection: 'collection',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    databaseUri: 'databaseUri',
    databaseName: 'databaseName',
    collection: 'collection',
    read: true,
    write: true,
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('connection properties is not an object', () => {
  const connection = 'connection';
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection properties should be an object.'
  );
});

test('databaseUri missing', () => {
  const connection = {
    collection: 'collection',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection should have required property "databaseUri".'
  );
});

test('databaseUri is not a string', () => {
  const connection = {
    databaseUri: true,
    collection: 'collection',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection property "databaseUri" should be a string.'
  );
});

test('collection missing', () => {
  const connection = {
    databaseUri: 'databaseUri',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection should have required property "collection".'
  );
});

test('collection is not a string', () => {
  const connection = {
    databaseUri: 'databaseUri',
    collection: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection property "collection" should be a string.'
  );
});

test('databaseName is not a string', () => {
  const connection = {
    databaseUri: 'databaseUri',
    collection: 'collection',
    databaseName: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection property "databaseName" should be a string.'
  );
});

test('read is not a boolean', () => {
  const connection = {
    databaseUri: 'databaseUri',
    collection: 'collection',
    read: 'read',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection property "read" should be a boolean.'
  );
});

test('write is not a boolean', () => {
  const connection = {
    databaseUri: 'databaseUri',
    collection: 'collection',
    write: 'write',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'MongoDBCollection connection property "write" should be a boolean.'
  );
});
