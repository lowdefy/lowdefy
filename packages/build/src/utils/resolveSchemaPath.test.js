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

import resolveSchemaPath from './resolveSchemaPath.js';

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    value: {
      type: 'object',
      additionalProperties: false,
      properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' } },
      },
    },
    open: { type: 'object' },
    mapped: { type: 'object', additionalProperties: { type: 'object', properties: { a: {} } } },
    patterned: { type: 'object', properties: { x: {} }, patternProperties: { '^y': {} } },
    either: {
      oneOf: [
        { type: 'object', additionalProperties: false, properties: { left: {} } },
        { type: 'object', additionalProperties: false, properties: { right: {} } },
      ],
    },
  },
};

test('resolveSchemaPath resolves declared top-level and nested properties', () => {
  expect(resolveSchemaPath({ schema, path: 'value' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema, path: 'value.name' })).toEqual({ resolved: true });
});

test('resolveSchemaPath resolves array indices in dot and bracket form through items', () => {
  expect(resolveSchemaPath({ schema, path: 'value.tags.0' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema, path: 'items[2].id' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema, path: 'items.$.id' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema, path: 'items.0.idd' })).toEqual({
    resolved: false,
    segment: 'idd',
    candidates: ['id'],
  });
});

test('resolveSchemaPath reports the first unresolved segment with its sibling candidates', () => {
  expect(resolveSchemaPath({ schema, path: 'valu' })).toEqual({
    resolved: false,
    segment: 'valu',
    candidates: ['value', 'items', 'open', 'mapped', 'patterned', 'either'],
  });
  expect(resolveSchemaPath({ schema, path: 'value.nme.deeper' })).toEqual({
    resolved: false,
    segment: 'nme',
    candidates: ['name', 'tags'],
  });
});

test('resolveSchemaPath accepts any path below a node that declares no shape', () => {
  expect(resolveSchemaPath({ schema, path: 'open.anything.at.all' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema: { type: 'object' }, path: 'whatever' })).toEqual({
    resolved: true,
  });
  expect(
    resolveSchemaPath({
      schema: { type: 'object', properties: { value: { description: 'Prose only.' } } },
      path: 'value.deep',
    })
  ).toEqual({ resolved: true });
});

test('resolveSchemaPath follows additionalProperties and accepts patternProperties', () => {
  expect(resolveSchemaPath({ schema, path: 'mapped.anyKey.a' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema, path: 'mapped.anyKey.b' })).toEqual({
    resolved: false,
    segment: 'b',
    candidates: ['a'],
  });
  expect(resolveSchemaPath({ schema, path: 'patterned.yes' })).toEqual({ resolved: true });
  expect(
    resolveSchemaPath({
      schema: { type: 'object', properties: { a: {} }, additionalProperties: true },
      path: 'zzz',
    })
  ).toEqual({ resolved: true });
});

test('resolveSchemaPath resolves through oneOf when any branch resolves', () => {
  expect(resolveSchemaPath({ schema, path: 'either.right' })).toEqual({ resolved: true });
  expect(resolveSchemaPath({ schema, path: 'either.middle' })).toEqual({
    resolved: false,
    segment: 'middle',
    candidates: ['left'],
  });
});
