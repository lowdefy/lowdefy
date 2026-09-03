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

import nestSchemaPaths from './nestSchemaPaths.js';

test('nestSchemaPaths nests dotted paths under implicit object nodes', () => {
  expect(
    nestSchemaPaths({
      paths: {
        'data.address': { type: 'object', properties: { formatted_address: { type: 'string' } } },
        'data.status': { enum: ['draft'] },
        evidence_ids: { type: 'array', items: { type: 'string' } },
      },
    })
  ).toEqual({
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          address: { type: 'object', properties: { formatted_address: { type: 'string' } } },
          status: { enum: ['draft'] },
        },
      },
      evidence_ids: { type: 'array', items: { type: 'string' } },
    },
  });
});

test('nestSchemaPaths merges a parent fragment with paths declared under it, whatever the order', () => {
  expect(
    nestSchemaPaths({
      paths: {
        'data.address': { type: 'string' },
        data: { type: 'object', description: 'Form data' },
      },
    })
  ).toEqual({
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'Form data',
        properties: { address: { type: 'string' } },
      },
    },
  });
});

test('nestSchemaPaths maps index segments onto items', () => {
  expect(nestSchemaPaths({ paths: { 'rows[0].name': { type: 'string' } } })).toEqual({
    type: 'object',
    properties: {
      rows: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
    },
  });
});

test('nestSchemaPaths returns an empty object schema for no paths', () => {
  expect(nestSchemaPaths({ paths: undefined })).toEqual({ type: 'object', properties: {} });
});

test('nestSchemaPaths drops ~-prefixed build metadata keys from paths and fragments', () => {
  expect(
    nestSchemaPaths({
      paths: {
        '~k': 'key1',
        count: { type: 'number', '~k': 'key2', items: { '~k': 'x', type: 'string' } },
      },
    })
  ).toEqual({
    type: 'object',
    properties: { count: { type: 'number', items: { type: 'string' } } },
  });
});
