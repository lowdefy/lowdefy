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

import validateUpdateFields from './validateUpdateFields.js';

const collectionSchema = {
  name: 'answers',
  fields: {
    test_id: { type: 'string' },
    result: { enum: ['pass', 'fail', 'partial', 'na'] },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    address: {
      type: 'object',
      properties: { city: { type: 'string' }, lines: { type: 'array', items: { type: 'string' } } },
    },
    count: { type: 'integer' },
  },
};

test('validateUpdateFields passes a conforming $set', () => {
  expect(() =>
    validateUpdateFields({
      update: { $set: { test_id: 't2', result: 'fail', evidence_ids: ['e1'] } },
      collectionSchema,
    })
  ).not.toThrow();
});

test('validateUpdateFields throws for a $set value that violates the contract', () => {
  expect(() =>
    validateUpdateFields({ update: { $set: { result: 'Pass' } }, collectionSchema })
  ).toThrow(
    'Field "result" in $set of an update for collection "answers" does not match the declared contract: must be equal to one of the allowed values (pass, fail, partial, na). Received "Pass".'
  );
});

test('validateUpdateFields validates $setOnInsert and ignores $inc', () => {
  expect(() =>
    validateUpdateFields({ update: { $setOnInsert: { test_id: 3 } }, collectionSchema })
  ).toThrow(
    'Field "test_id" in $setOnInsert of an update for collection "answers" does not match the declared contract: must be string. Received 3.'
  );
  expect(() =>
    validateUpdateFields({
      update: { $inc: { count: 'not-a-number' }, $unset: { result: '' } },
      collectionSchema,
    })
  ).not.toThrow();
});

// Appending to an array is the most common way an array field drifts, so the
// operand is checked against the field's items schema.
test('validateUpdateFields validates a $push operand against the field items schema', () => {
  expect(() =>
    validateUpdateFields({ update: { $push: { evidence_ids: 'e9' } }, collectionSchema })
  ).not.toThrow();
  expect(() =>
    validateUpdateFields({ update: { $push: { evidence_ids: 4 } }, collectionSchema })
  ).toThrow(
    'Field "evidence_ids" in $push of an update for collection "answers" does not match the declared contract: must be string. Received 4.'
  );
});

test('validateUpdateFields validates every element of a $push $each and of $addToSet', () => {
  expect(() =>
    validateUpdateFields({
      update: { $push: { evidence_ids: { $each: ['e1', 'e2'], $slice: -3 } } },
      collectionSchema,
    })
  ).not.toThrow();
  expect(() =>
    validateUpdateFields({
      update: { $push: { evidence_ids: { $each: ['e1', 7] } } },
      collectionSchema,
    })
  ).toThrow('Field "evidence_ids" in $push of an update for collection "answers"');
  expect(() =>
    validateUpdateFields({ update: { $addToSet: { evidence_ids: 7 } }, collectionSchema })
  ).toThrow('Field "evidence_ids" in $addToSet of an update for collection "answers"');
});

test('validateUpdateFields leaves a $push on an undeclared or non-array field alone', () => {
  expect(() =>
    validateUpdateFields({ update: { $push: { notes: 7, test_id: 7 } }, collectionSchema })
  ).not.toThrow();
});

test('validateUpdateFields refuses to $unset a required field', () => {
  const withRequired = { ...collectionSchema, required: ['test_id'] };
  expect(() =>
    validateUpdateFields({ update: { $unset: { test_id: '' } }, collectionSchema: withRequired })
  ).toThrow(
    'Field "test_id" in $unset of an update for collection "answers" is required by the declared contract and cannot be removed.'
  );
  expect(() =>
    validateUpdateFields({ update: { $unset: { result: '' } }, collectionSchema: withRequired })
  ).not.toThrow();
});

test('validateUpdateFields refuses to $unset a nested required field', () => {
  const nested = {
    name: 'answers',
    fields: {
      address: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
    required: [],
  };
  expect(() =>
    validateUpdateFields({ update: { $unset: { 'address.city': '' } }, collectionSchema: nested })
  ).toThrow('Field "address.city" in $unset of an update');
});

// An upserting update is the one update shape that can create a document, so
// it has to satisfy the document-level required contract.
test('validateUpdateFields checks required presence on an upsert over filter, $set and $setOnInsert', () => {
  const withRequired = { ...collectionSchema, required: ['test_id', 'result'] };
  expect(() =>
    validateUpdateFields({
      update: { $set: { result: 'pass' } },
      filter: { test_id: 't1' },
      options: { upsert: true },
      collectionSchema: withRequired,
    })
  ).not.toThrow();
  expect(() =>
    validateUpdateFields({
      update: { $setOnInsert: { test_id: 't1' } },
      filter: {},
      options: { upsert: true },
      collectionSchema: withRequired,
    })
  ).toThrow(
    'Field "result" is required by the declared contract for collection "answers", but the upserting an update does not set it in the filter, $set or $setOnInsert.'
  );
  expect(() =>
    validateUpdateFields({
      update: { $setOnInsert: { test_id: 't1' } },
      filter: {},
      collectionSchema: withRequired,
    })
  ).not.toThrow();
});

test('validateUpdateFields resolves a dotted $set key into a nested field schema', () => {
  expect(() =>
    validateUpdateFields({ update: { $set: { 'address.city': 'Cape Town' } }, collectionSchema })
  ).not.toThrow();
  expect(() =>
    validateUpdateFields({ update: { $set: { 'address.city': 42 } }, collectionSchema })
  ).toThrow(
    'Field "address.city" in $set of an update for collection "answers" does not match the declared contract: must be string. Received 42.'
  );
});

test('validateUpdateFields resolves array positions in a dotted key into items', () => {
  expect(() =>
    validateUpdateFields({ update: { $set: { 'evidence_ids.0': 'e9' } }, collectionSchema })
  ).not.toThrow();
  expect(() =>
    validateUpdateFields({ update: { $set: { 'evidence_ids.$': 9 } }, collectionSchema })
  ).toThrow('Field "evidence_ids.$" in $set of an update for collection "answers"');
  expect(() =>
    validateUpdateFields({ update: { $set: { 'address.lines.$[el]': 9 } }, collectionSchema })
  ).toThrow('Field "address.lines.$[el]" in $set of an update for collection "answers"');
});

test('validateUpdateFields passes undeclared and undeclared-nested keys', () => {
  expect(() =>
    validateUpdateFields({
      update: { $set: { reviewed_by: 1, 'address.postcode': 7, 'other.deep.path': [] } },
      collectionSchema,
    })
  ).not.toThrow();
});

test('validateUpdateFields passes null in $set as a cleared field', () => {
  expect(() =>
    validateUpdateFields({ update: { $set: { result: null } }, collectionSchema })
  ).not.toThrow();
});

test('validateUpdateFields ignores pipeline updates and updates without $set', () => {
  expect(() =>
    validateUpdateFields({ update: [{ $set: { result: 'x' } }], collectionSchema })
  ).not.toThrow();
  expect(() =>
    validateUpdateFields({ update: { $inc: { count: 1 } }, collectionSchema })
  ).not.toThrow();
});

test('validateUpdateFields uses the given position', () => {
  expect(() =>
    validateUpdateFields({
      update: { $set: { result: 'x' } },
      collectionSchema,
      position: 'an update (operations[2])',
    })
  ).toThrow('Field "result" in $set of an update (operations[2]) for collection "answers"');
});
