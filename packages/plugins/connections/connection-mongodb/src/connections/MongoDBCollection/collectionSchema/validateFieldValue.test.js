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

import { ConfigError } from '@lowdefy/errors';

import validateFieldValue from './validateFieldValue.js';

const base = { collectionName: 'answers', fieldName: 'f', position: 'an insert document' };

test('validateFieldValue returns for a valid value and for null', () => {
  expect(() =>
    validateFieldValue({ ...base, fieldSchema: { type: 'number' }, value: 1 })
  ).not.toThrow();
  expect(() =>
    validateFieldValue({ ...base, fieldSchema: { type: 'number' }, value: null })
  ).not.toThrow();
});

test('validateFieldValue throws a ConfigError with ajv wording for a type mismatch', () => {
  expect(() =>
    validateFieldValue({ ...base, fieldSchema: { type: 'integer' }, value: 1.5 })
  ).toThrow(
    new ConfigError(
      'Field "f" in an insert document for collection "answers" does not match the declared contract: must be integer. Received 1.5.'
    )
  );
});

test('validateFieldValue reports undefined as undefined', () => {
  expect(() =>
    validateFieldValue({ ...base, fieldSchema: { type: 'string' }, value: undefined })
  ).toThrow('must be string. Received undefined.');
});

test('validateFieldValue spells out the allowed values of an enum', () => {
  expect(() => validateFieldValue({ ...base, fieldSchema: { enum: [1, 2] }, value: 3 })).toThrow(
    'must be equal to one of the allowed values (1, 2). Received 3.'
  );
});

test('validateFieldValue validates a Date against a date-time format', () => {
  const fieldSchema = { type: 'string', format: 'date-time' };
  expect(() => validateFieldValue({ ...base, fieldSchema, value: new Date(0) })).not.toThrow();
  expect(() => validateFieldValue({ ...base, fieldSchema, value: 3 })).toThrow('must be string');
});

test('validateFieldValue names the nested item path of an array violation', () => {
  expect(() =>
    validateFieldValue({
      ...base,
      fieldSchema: { type: 'array', items: { type: 'array', items: { type: 'boolean' } } },
      value: [[true], [false, 'x']],
    })
  ).toThrow('Field "f.1.1" in an insert document for collection "answers"');
});
