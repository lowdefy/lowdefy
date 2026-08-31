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

import expandArchetype from './expandArchetype.js';

const collections = {
  controls: {
    fields: {
      _id: { type: 'string' },
      title: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'active'] },
    },
    connections: [{ connectionId: 'controls', read: true }],
  },
};

function pageContext(overrides = {}) {
  return {
    pageId: 'controls',
    rootBlockId: 'controls',
    context: { collections },
    ...overrides,
  };
}

test('expandArchetype rewrites a ListPage root into its layout with blocks and requests', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    properties: { collection: 'controls', columns: ['title', 'status'] },
  };
  expandArchetype(block, pageContext());
  expect(block.type).toBe('Box');
  expect(Array.isArray(block.blocks)).toBe(true);
  expect(block.requests).toHaveLength(1);
  expect(block.requests[0].id).toBe('list');
  expect(block.events.onInitAsync).toBeDefined();
  expect(block.properties).toEqual({});
  expect(block.type).not.toBe('ListPage');
});

test('expandArchetype leaves a non-archetype block untouched', () => {
  const block = { id: 'x', type: 'Box', properties: { a: 1 } };
  expandArchetype(block, pageContext({ rootBlockId: 'x', pageId: 'x' }));
  expect(block.type).toBe('Box');
  expect(block.properties).toEqual({ a: 1 });
});

test('expandArchetype errors when an archetype is used on a nested block', () => {
  const block = {
    id: 'nested',
    type: 'ListPage',
    '~k': 'k1',
    properties: { collection: 'controls' },
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(
    /can only be a page's root type/
  );
});

test('expandArchetype rejects an unknown archetype prop with a suggestion', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    properties: { collection: 'controls', column: ['title'] },
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(/has no prop "column".*columns/s);
});

test('expandArchetype requires the collection prop', () => {
  const block = { id: 'controls', type: 'ListPage', '~k': 'k1', properties: {} };
  expect(() => expandArchetype(block, pageContext())).toThrow(/requires prop "collection"/);
});

test('expandArchetype rejects an operator-valued prop loudly', () => {
  // The generator runs at build; an operator prop cannot be honoured and must
  // not silently fall back to the prop default.
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    properties: { collection: 'controls', title: { _state: 'page_title' } },
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(
    'Archetype "ListPage" prop "title" on page "controls" is an operator (_state). Archetype props are resolved at build time and must be literal values.'
  );
});

test('expandArchetype accepts an integer pageSize literal', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    properties: { collection: 'controls', pageSize: 25 },
  };
  expandArchetype(block, pageContext());
  expect(block.requests[0].properties.options.limit).toBe(25);
});
