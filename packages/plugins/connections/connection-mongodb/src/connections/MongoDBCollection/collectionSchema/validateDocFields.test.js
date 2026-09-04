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

import { ObjectId } from 'mongodb';
import { ConfigError } from '@lowdefy/errors';

import validateDocFields from './validateDocFields.js';

// The normalised shape task 38 writes to build/collections.json for
//   fields: { test_id: string, result: { enum: [...] }, evidence_ids: [string],
//             created_at: date, meta: object }
const collectionSchema = {
  name: 'answers',
  fields: {
    test_id: { type: 'string' },
    result: { enum: ['pass', 'fail', 'partial', 'na'] },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    created_at: { type: 'string', format: 'date-time' },
    meta: { type: 'object' },
  },
};

test('validateDocFields passes a conforming document', () => {
  expect(() =>
    validateDocFields({
      doc: {
        test_id: 't1',
        result: 'pass',
        evidence_ids: ['e1', 'e2'],
        created_at: new Date(),
        meta: { source: 'import' },
      },
      collectionSchema,
    })
  ).not.toThrow();
});

test('validateDocFields throws a ConfigError naming field, expectation and value for a wrong scalar type', () => {
  expect(() => validateDocFields({ doc: { test_id: 12 }, collectionSchema })).toThrow(
    new ConfigError(
      'Field "test_id" in an insert document for collection "answers" does not match the declared contract: must be string. Received 12.'
    )
  );
  let thrown;
  try {
    validateDocFields({ doc: { test_id: 12 }, collectionSchema });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
});

test('validateDocFields lists the allowed values for a value outside an enum', () => {
  expect(() =>
    validateDocFields({ doc: { test_id: 't1', result: 'Pass' }, collectionSchema })
  ).toThrow(
    'Field "result" in an insert document for collection "answers" does not match the declared contract: must be equal to one of the allowed values (pass, fail, partial, na). Received "Pass".'
  );
});

test('validateDocFields names the offending item of an array whose items type is wrong', () => {
  expect(() => validateDocFields({ doc: { evidence_ids: ['e1', 2] }, collectionSchema })).toThrow(
    'Field "evidence_ids.1" in an insert document for collection "answers" does not match the declared contract: must be string. Received ["e1",2].'
  );
  expect(() => validateDocFields({ doc: { evidence_ids: 'e1' }, collectionSchema })).toThrow(
    'Field "evidence_ids" in an insert document for collection "answers" does not match the declared contract: must be array. Received "e1".'
  );
});

test('validateDocFields passes undeclared keys', () => {
  expect(() =>
    validateDocFields({
      doc: { test_id: 't1', result: 'pass', reviewed_by: 'u1', anything: { nested: [1] } },
      collectionSchema,
    })
  ).not.toThrow();
});

// R6: `date` is { type: string, format: date-time } on every surface, and the
// live Date the driver holds is validated as the ISO string it represents.
test('validateDocFields accepts a Date for a date-time field and rejects a non-date string', () => {
  expect(() =>
    validateDocFields({ doc: { created_at: new Date('2026-01-01') }, collectionSchema })
  ).not.toThrow();
  expect(() =>
    validateDocFields({ doc: { created_at: '2026-01-01T00:00:00.000Z' }, collectionSchema })
  ).not.toThrow();
  expect(() => validateDocFields({ doc: { created_at: 'yesterday' }, collectionSchema })).toThrow(
    'Field "created_at" in an insert document for collection "answers" does not match the declared contract: must match format "date-time". Received "yesterday".'
  );
});

test('validateDocFields accepts an ObjectId instance for a field declared object', () => {
  expect(() =>
    validateDocFields({ doc: { meta: new ObjectId() }, collectionSchema })
  ).not.toThrow();
});

test('validateDocFields passes null for a declared field that is not required', () => {
  expect(() =>
    validateDocFields({ doc: { test_id: null, created_at: null }, collectionSchema })
  ).not.toThrow();
});

test('validateDocFields requires a field declared required to be present and non-null', () => {
  const required = {
    name: 'answers',
    fields: { organization_id: { type: 'string' } },
    required: ['organization_id'],
  };
  expect(() =>
    validateDocFields({ doc: { organization_id: 'org_a' }, collectionSchema: required })
  ).not.toThrow();
  expect(() => validateDocFields({ doc: {}, collectionSchema: required })).toThrow(
    'Field "organization_id" in an insert document for collection "answers" is required by the declared contract but is missing.'
  );
  expect(() =>
    validateDocFields({ doc: { organization_id: null }, collectionSchema: required })
  ).toThrow(
    'Field "organization_id" in an insert document for collection "answers" is required by the declared contract but is null.'
  );
  expect(() =>
    validateDocFields({ doc: { organization_id: 7 }, collectionSchema: required })
  ).toThrow('must be string. Received 7.');
});

test('validateDocFields uses the given position in the message', () => {
  expect(() =>
    validateDocFields({
      doc: { result: 'x' },
      collectionSchema,
      position: 'a replacement document',
    })
  ).toThrow('Field "result" in a replacement document for collection "answers"');
});

test('validateDocFields ignores a document that is not an object', () => {
  expect(() => validateDocFields({ doc: undefined, collectionSchema })).not.toThrow();
});
