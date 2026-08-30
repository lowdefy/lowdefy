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

import getRequiredValidation from './getRequiredValidation.js';

const message = 'Required';

test('getRequiredValidation uses the empty test when no type is declared', () => {
  expect(getRequiredValidation({ declaredType: undefined, message })).toEqual({
    pass: { _not: { _type: 'empty' } },
    status: 'error',
    message,
  });
});

test('getRequiredValidation keeps empty string and empty array empty for string and array', () => {
  expect(getRequiredValidation({ declaredType: 'string', message }).pass).toEqual({
    _not: { _type: 'empty' },
  });
  expect(getRequiredValidation({ declaredType: 'array', message }).pass).toEqual({
    _not: { _type: 'empty' },
  });
});

test('getRequiredValidation treats only null and undefined as empty for number, integer, boolean and object', () => {
  ['number', 'integer', 'boolean', 'object'].forEach((declaredType) => {
    expect(getRequiredValidation({ declaredType, message }).pass).toEqual({
      _not: { _type: 'none' },
    });
  });
});

test('getRequiredValidation reads the first non-null type from a type array', () => {
  expect(getRequiredValidation({ declaredType: ['null', 'number'], message }).pass).toEqual({
    _not: { _type: 'none' },
  });
  expect(getRequiredValidation({ declaredType: ['null', 'string'], message }).pass).toEqual({
    _not: { _type: 'empty' },
  });
});
