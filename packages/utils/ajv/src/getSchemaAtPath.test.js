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

import getSchemaAtPath from './getSchemaAtPath.js';

const schema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { formatted_address: { type: 'string' } },
          required: ['formatted_address'],
        },
        status: { enum: ['draft', 'submitted'] },
        meta: { type: 'object' },
      },
    },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array' },
    choice: {
      anyOf: [{ type: 'object', properties: { a: { type: 'number' } } }, { type: 'null' }],
    },
    dict: { type: 'object', properties: {}, additionalProperties: { type: 'boolean' } },
  },
};

test('getSchemaAtPath returns the root schema for an empty path', () => {
  expect(getSchemaAtPath({ schema, path: '' })).toBe(schema);
});

test('getSchemaAtPath walks nested properties', () => {
  expect(getSchemaAtPath({ schema, path: 'data.address.formatted_address' })).toEqual({
    type: 'string',
  });
});

test('getSchemaAtPath returns null for a property the schema does not declare', () => {
  expect(getSchemaAtPath({ schema, path: 'data.address.formated_address' })).toBeNull();
  expect(getSchemaAtPath({ schema, path: 'nope' })).toBeNull();
});

test('getSchemaAtPath returns null below a scalar', () => {
  expect(getSchemaAtPath({ schema, path: 'data.status.x' })).toBeNull();
  expect(getSchemaAtPath({ schema, path: 'data.address.formatted_address.x' })).toBeNull();
});

test('getSchemaAtPath maps index and $ segments onto items', () => {
  expect(getSchemaAtPath({ schema, path: 'evidence_ids[0]' })).toEqual({ type: 'string' });
  expect(getSchemaAtPath({ schema, path: 'evidence_ids.$' })).toEqual({ type: 'string' });
  expect(getSchemaAtPath({ schema, path: 'evidence_ids.foo' })).toBeNull();
});

test('getSchemaAtPath leaves an object without properties and an array without items open', () => {
  expect(getSchemaAtPath({ schema, path: 'data.meta.anything.deeper' })).toEqual({});
  expect(getSchemaAtPath({ schema, path: 'tags[3]' })).toEqual({});
});

test('getSchemaAtPath searches combinator branches', () => {
  expect(getSchemaAtPath({ schema, path: 'choice.a' })).toEqual({ type: 'number' });
  expect(getSchemaAtPath({ schema, path: 'choice.b' })).toBeNull();
});

test('getSchemaAtPath uses an additionalProperties schema for unlisted members', () => {
  expect(getSchemaAtPath({ schema, path: 'dict.anything' })).toEqual({ type: 'boolean' });
});

test('getSchemaAtPath accepts an array of segments', () => {
  expect(getSchemaAtPath({ schema, path: ['data', 'status'] })).toEqual({
    enum: ['draft', 'submitted'],
  });
});
