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
  properties: {
    results: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } },
    meta: { type: 'object' },
    loose: { type: 'object', properties: { a: {} }, additionalProperties: true },
    either: { oneOf: [{ type: 'object', properties: { x: {} } }, { type: 'null' }] },
    total: { type: 'integer' },
  },
};

test('resolveSchemaPath resolves declared paths through properties and items', () => {
  expect(resolveSchemaPath({ schema, path: 'results[0].id' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'results.0.id' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'total' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'either.x' }).resolved).toBe(true);
});

test('resolveSchemaPath lists the sorted top-level declared keys', () => {
  expect(resolveSchemaPath({ schema, path: 'total' }).declared).toEqual([
    'either',
    'loose',
    'meta',
    'results',
    'total',
  ]);
});

test('resolveSchemaPath rejects an undeclared property and names the failing segment', () => {
  expect(resolveSchemaPath({ schema, path: 'totl' })).toEqual({
    resolved: false,
    declared: ['either', 'loose', 'meta', 'results', 'total'],
    segment: 'totl',
    candidates: ['either', 'loose', 'meta', 'results', 'total'],
  });
  expect(resolveSchemaPath({ schema, path: 'results[0].name' }).candidates).toEqual(['id']);
  expect(resolveSchemaPath({ schema, path: 'results[0].name' }).segment).toBe('name');
  expect(resolveSchemaPath({ schema, path: 'either.y' }).resolved).toBe(false);
});

test('resolveSchemaPath rejects reading into a primitive or a non-index array segment', () => {
  expect(resolveSchemaPath({ schema, path: 'total.x' }).resolved).toBe(false);
  expect(resolveSchemaPath({ schema, path: 'results.first' }).resolved).toBe(false);
});

test('resolveSchemaPath resolves anything under an open shape', () => {
  expect(resolveSchemaPath({ schema, path: 'meta.anything.deep' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'loose.other' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema: { type: 'object' }, path: 'x.y' }).resolved).toBe(true);
});

// Cases from the event-payload check (task 39), against its own fixture.
describe('event payload schemas', () => {
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
    expect(resolveSchemaPath({ schema, path: 'value' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema, path: 'value.name' })).toMatchObject({ resolved: true });
  });

  test('resolveSchemaPath resolves array indices in dot and bracket form through items', () => {
    expect(resolveSchemaPath({ schema, path: 'value.tags.0' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema, path: 'items[2].id' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema, path: 'items.$.id' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema, path: 'items.0.idd' })).toMatchObject({
      resolved: false,
      segment: 'idd',
      candidates: expect.arrayContaining(['id']),
    });
  });

  test('resolveSchemaPath reports the first unresolved segment with its sibling candidates', () => {
    expect(resolveSchemaPath({ schema, path: 'valu' })).toMatchObject({
      resolved: false,
      segment: 'valu',
      candidates: expect.arrayContaining(['value', 'items', 'open', 'mapped', 'patterned', 'either']),
    });
    expect(resolveSchemaPath({ schema, path: 'value.nme.deeper' })).toMatchObject({
      resolved: false,
      segment: 'nme',
      candidates: expect.arrayContaining(['name', 'tags']),
    });
  });

  test('resolveSchemaPath accepts any path below a node that declares no shape', () => {
    expect(resolveSchemaPath({ schema, path: 'open.anything.at.all' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema: { type: 'object' }, path: 'whatever' })).toMatchObject({
      resolved: true,
    });
    expect(
      resolveSchemaPath({
        schema: { type: 'object', properties: { value: { description: 'Prose only.' } } },
        path: 'value.deep',
      })
    ).toMatchObject({ resolved: true });
  });

  test('resolveSchemaPath follows additionalProperties and accepts patternProperties', () => {
    expect(resolveSchemaPath({ schema, path: 'mapped.anyKey.a' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema, path: 'mapped.anyKey.b' })).toMatchObject({
      resolved: false,
      segment: 'b',
      candidates: expect.arrayContaining(['a']),
    });
    expect(resolveSchemaPath({ schema, path: 'patterned.yes' })).toMatchObject({ resolved: true });
    expect(
      resolveSchemaPath({
        schema: { type: 'object', properties: { a: {} }, additionalProperties: true },
        path: 'zzz',
      })
    ).toMatchObject({ resolved: true });
  });

  test('resolveSchemaPath resolves through oneOf when any branch resolves', () => {
    expect(resolveSchemaPath({ schema, path: 'either.right' })).toMatchObject({ resolved: true });
    expect(resolveSchemaPath({ schema, path: 'either.middle' })).toMatchObject({
      resolved: false,
      segment: 'middle',
      candidates: expect.arrayContaining(['left']),
    });
  });
});
