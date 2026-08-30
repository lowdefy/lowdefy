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

import { compile } from '@lowdefy/ajv';

import getFieldValidator from './getFieldValidator.js';

test('getFieldValidator compiles a field schema once and memoises it by schema object', () => {
  const fieldSchema = { type: 'string' };
  const first = getFieldValidator({ fieldSchema });
  const second = getFieldValidator({ fieldSchema });
  expect(first).toBe(second);
  expect(first('a').valid).toBe(true);
  expect(first(1).valid).toBe(false);
  expect(getFieldValidator({ fieldSchema: { type: 'string' } })).not.toBe(first);
});

test('getFieldValidator strips the build presence flag required before compiling', () => {
  expect(() => compile({ schema: { type: 'string', required: true } })).toThrow();
  const validator = getFieldValidator({
    fieldSchema: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        required: true,
        properties: { a: { type: 'string', required: true } },
      },
    },
  });
  expect(validator([{ a: 'x' }]).valid).toBe(true);
  expect(validator([{ a: 1 }]).valid).toBe(false);
});

test('getFieldValidator supports instanceof Date and enum without a type', () => {
  expect(getFieldValidator({ fieldSchema: { instanceof: 'Date' } })(new Date()).valid).toBe(true);
  expect(getFieldValidator({ fieldSchema: { instanceof: 'Date' } })('2026').valid).toBe(false);
  const enumValidator = getFieldValidator({ fieldSchema: { enum: ['a', 1] } });
  expect(enumValidator(1).valid).toBe(true);
  expect(enumValidator('b').valid).toBe(false);
});
