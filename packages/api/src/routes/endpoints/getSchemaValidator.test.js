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

import getSchemaValidator from './getSchemaValidator.js';

// A ValidateSchema step evaluates its schema on every call, so each call passes a new object.
test('getSchemaValidator returns one validator for the same schema content in new objects', () => {
  const first = getSchemaValidator({ schema: { type: 'object', required: ['sku'] } });
  const second = getSchemaValidator({ schema: { required: ['sku'], type: 'object' } });
  expect(second).toBe(first);
  expect(first({ sku: 'a' }).valid).toBe(true);
  expect(first({}).valid).toBe(false);
});

test('getSchemaValidator gives a schema with different content its own validator', () => {
  const name = getSchemaValidator({ schema: { type: 'object', required: ['name'] } });
  const code = getSchemaValidator({ schema: { type: 'object', required: ['code'] } });
  expect(code).not.toBe(name);
  expect(name({ name: 'a' }).valid).toBe(true);
  expect(code({ name: 'a' }).valid).toBe(false);
});
