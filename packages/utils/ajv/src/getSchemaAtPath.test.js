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

// Semantics pinned when the build's resolveSchemaPath was merged into this
// walker: one set of rules for state contracts, responseSchemas and event
// payloads alike.

test('getSchemaAtPath resolves .length on an array', () => {
  expect(
    getSchemaAtPath({ schema: { type: 'array', items: { type: 'string' } }, path: 'length' })
  ).toEqual({ type: 'integer' });
  expect(
    getSchemaAtPath({
      schema: { type: 'object', properties: { rows: { type: 'array' } } },
      path: 'rows.length',
    })
  ).toEqual({ type: 'integer' });
});

test('getSchemaAtPath rejects a path below a primitive', () => {
  expect(
    getSchemaAtPath({
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      path: 'name.length',
    })
  ).toBe(null);
  expect(getSchemaAtPath({ schema: { type: 'number' }, path: 'x' })).toBe(null);
});

test('getSchemaAtPath treats enum and const nodes as closed', () => {
  expect(getSchemaAtPath({ schema: { enum: ['a', 'b'] }, path: 'a' })).toBe(null);
  expect(getSchemaAtPath({ schema: { const: 'a' }, path: 'a' })).toBe(null);
});

test('getSchemaAtPath resolves an open object to {}', () => {
  expect(getSchemaAtPath({ schema: { type: 'object' }, path: 'anything.at.all' })).toEqual({});
  expect(getSchemaAtPath({ schema: {}, path: 'anything' })).toEqual({});
});

test('getSchemaAtPath explain returns the failing segment and its candidates', () => {
  const schema = {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: { type: 'object', properties: { title: { type: 'string' } } },
      },
    },
  };
  expect(getSchemaAtPath({ schema, path: 'results.0.titel', explain: true })).toEqual({
    resolved: false,
    declared: ['results'],
    segment: 'titel',
    candidates: ['title'],
  });
});

test('getSchemaAtPath explain reports a resolved path with the sub-schema', () => {
  const schema = { type: 'object', properties: { a: { type: 'string' } } };
  expect(getSchemaAtPath({ schema, path: 'a', explain: true })).toEqual({
    resolved: true,
    declared: ['a'],
    schema: { type: 'string' },
  });
});

test('getSchemaAtPath explain lists candidates from combinator branches', () => {
  const schema = {
    anyOf: [
      { type: 'object', properties: { a: {} } },
      { type: 'object', properties: { b: {} } },
    ],
  };
  expect(getSchemaAtPath({ schema, path: 'c', explain: true })).toEqual({
    resolved: false,
    declared: ['a', 'b'],
    segment: 'c',
    candidates: ['a', 'b'],
  });
});

test('getSchemaAtPath opens an undeclared member when additionalProperties is true beside declared properties', () => {
  const schema = {
    type: 'object',
    properties: { value: { type: 'string' } },
    additionalProperties: true,
  };
  expect(getSchemaAtPath({ schema, path: 'value' })).toEqual({ type: 'string' });
  expect(getSchemaAtPath({ schema, path: 'anything.nested' })).toEqual({});
});

