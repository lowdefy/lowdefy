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

import getRefPositions from './getRefPositions.js';

test('getRefPositions finds ref at top level', () => {
  const content = { _ref: { id: 'ref1' } };
  const positions = getRefPositions(content, '');
  expect(positions.get('ref1')).toBe('');
});

test('getRefPositions finds ref nested in object', () => {
  const content = {
    pages: [
      {
        blocks: { _ref: { id: 'ref1' } },
      },
    ],
  };
  const positions = getRefPositions(content, '');
  expect(positions.get('ref1')).toBe('pages.0.blocks');
});

test('getRefPositions finds multiple refs', () => {
  const content = {
    pages: [
      {
        blocks: { _ref: { id: 'ref1' } },
        events: { _ref: { id: 'ref2' } },
      },
    ],
    connections: [{ _ref: { id: 'ref3' } }],
  };
  const positions = getRefPositions(content, '');
  expect(positions.get('ref1')).toBe('pages.0.blocks');
  expect(positions.get('ref2')).toBe('pages.0.events');
  expect(positions.get('ref3')).toBe('connections.0');
});

test('getRefPositions applies basePath prefix', () => {
  const content = {
    blocks: [{ _ref: { id: 'ref1' } }],
  };
  const positions = getRefPositions(content, 'pages.0');
  expect(positions.get('ref1')).toBe('pages.0.blocks.0');
});

test('getRefPositions returns empty map for content without refs', () => {
  const content = {
    id: 'home',
    type: 'PageHeaderMenu',
    blocks: [{ id: 'block1', type: 'TextInput' }],
  };
  const positions = getRefPositions(content, '');
  expect(positions.size).toBe(0);
});

test('getRefPositions handles null and primitive values', () => {
  const content = {
    id: 'home',
    count: 42,
    enabled: true,
    value: null,
  };
  const positions = getRefPositions(content, '');
  expect(positions.size).toBe(0);
});

test('getRefPositions finds deeply nested refs', () => {
  const content = {
    pages: [
      {
        areas: {
          content: {
            blocks: [
              {
                areas: {
                  items: [{ _ref: { id: 'deep-ref' } }],
                },
              },
            ],
          },
        },
      },
    ],
  };
  const positions = getRefPositions(content, '');
  expect(positions.get('deep-ref')).toBe('pages.0.areas.content.blocks.0.areas.items.0');
});

test('getRefPositions does not recurse into _ref objects', () => {
  const content = {
    blocks: {
      _ref: { id: 'ref1', nested: { _ref: { id: 'should-not-find' } } },
    },
  };
  const positions = getRefPositions(content, '');
  expect(positions.get('ref1')).toBe('blocks');
  expect(positions.has('should-not-find')).toBe(false);
});
