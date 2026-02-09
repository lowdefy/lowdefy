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

import formatActionValidationError from './formatActionValidationError.js';

describe('formatActionValidationError', () => {
  test('formats type error', () => {
    const result = formatActionValidationError(
      {
        keyword: 'type',
        instancePath: '/ms',
        params: { type: 'integer' },
      },
      'Wait',
      { ms: 'abc' }
    );
    expect(result).toBe(
      'Action "Wait" param "ms" must be type "integer". Received "abc" (string).'
    );
  });

  test('formats type error with null value', () => {
    const result = formatActionValidationError(
      {
        keyword: 'type',
        instancePath: '/ms',
        params: { type: 'integer' },
      },
      'Wait',
      { ms: null }
    );
    expect(result).toBe('Action "Wait" param "ms" must be type "integer". Received null (null).');
  });

  test('formats enum error', () => {
    const result = formatActionValidationError(
      {
        keyword: 'enum',
        instancePath: '/responseFunction',
        params: { allowedValues: ['json', 'text', 'blob'] },
      },
      'Fetch',
      { responseFunction: 'xml' }
    );
    expect(result).toBe(
      'Action "Fetch" param "responseFunction" must be one of ["json", "text", "blob"]. Received "xml".'
    );
  });

  test('formats additionalProperties error', () => {
    const result = formatActionValidationError(
      {
        keyword: 'additionalProperties',
        instancePath: '',
        params: { additionalProperty: 'extra' },
      },
      'Wait',
      { ms: 1000, extra: true }
    );
    expect(result).toBe('Action "Wait" param "extra" is not allowed.');
  });

  test('formats required error', () => {
    const result = formatActionValidationError(
      {
        keyword: 'required',
        instancePath: '',
        params: { missingProperty: 'ms' },
      },
      'Wait',
      {}
    );
    expect(result).toBe('Action "Wait" required param "ms" is missing.');
  });

  test('formats generic error', () => {
    const result = formatActionValidationError(
      {
        keyword: 'minimum',
        instancePath: '/ms',
        message: 'must be >= 0',
      },
      'Wait',
      { ms: -1 }
    );
    expect(result).toBe('Action "Wait" param "ms" must be >= 0. Received -1.');
  });

  test('formats nested path error', () => {
    const result = formatActionValidationError(
      {
        keyword: 'type',
        instancePath: '/options/behavior',
        params: { type: 'string' },
      },
      'ScrollTo',
      { options: { behavior: 123 } }
    );
    expect(result).toBe(
      'Action "ScrollTo" param "options.behavior" must be type "string". Received 123 (number).'
    );
  });
});
