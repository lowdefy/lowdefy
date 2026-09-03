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

import validateBulkOperationFields from './validateBulkOperationFields.js';

const collectionSchema = {
  name: 'answers',
  fields: {
    test_id: { type: 'string' },
    result: { enum: ['pass', 'fail', 'partial', 'na'] },
  },
};

test('validateBulkOperationFields passes conforming operations of every kind', () => {
  expect(() =>
    validateBulkOperationFields({
      operations: [
        { insertOne: { document: { test_id: 't1', result: 'pass', extra: 1 } } },
        { replaceOne: { filter: { _id: 1 }, replacement: { test_id: 't2', result: 'fail' } } },
        { updateOne: { filter: { _id: 1 }, update: { $set: { result: 'na' } } } },
        { updateMany: { filter: {}, update: { $inc: { count: 1 } } } },
        { deleteOne: { filter: { _id: 1 } } },
        { deleteMany: { filter: { result: 12 } } },
      ],
      collectionSchema,
    })
  ).not.toThrow();
});

test('validateBulkOperationFields validates an insertOne document', () => {
  expect(() =>
    validateBulkOperationFields({
      operations: [{ insertOne: { document: { test_id: 1 } } }],
      collectionSchema,
    })
  ).toThrow(
    'Field "test_id" in an insert document (operations[0]) for collection "answers" does not match the declared contract: must be string. Received 1.'
  );
});

test('validateBulkOperationFields validates a replaceOne replacement', () => {
  expect(() =>
    validateBulkOperationFields({
      operations: [
        { deleteOne: { filter: {} } },
        { replaceOne: { filter: { _id: 1 }, replacement: { result: 'Pass' } } },
      ],
      collectionSchema,
    })
  ).toThrow(
    'Field "result" in a replacement document (operations[1]) for collection "answers" does not match the declared contract: must be equal to one of the allowed values (pass, fail, partial, na). Received "Pass".'
  );
});

test('validateBulkOperationFields validates updateOne and updateMany $set values', () => {
  expect(() =>
    validateBulkOperationFields({
      operations: [{ updateOne: { filter: {}, update: { $set: { test_id: false } } } }],
      collectionSchema,
    })
  ).toThrow(
    'Field "test_id" in $set of an update (operations[0]) for collection "answers" does not match the declared contract: must be string. Received false.'
  );
  expect(() =>
    validateBulkOperationFields({
      operations: [{ updateMany: { filter: {}, update: { $setOnInsert: { result: 'x' } } } }],
      collectionSchema,
    })
  ).toThrow('Field "result" in $setOnInsert of an update (operations[0]) for collection "answers"');
});

test('validateBulkOperationFields ignores delete operations and unknown kinds', () => {
  expect(() =>
    validateBulkOperationFields({
      operations: [{ deleteOne: { filter: { test_id: 1 } } }, { somethingElse: {} }, {}],
      collectionSchema,
    })
  ).not.toThrow();
});
