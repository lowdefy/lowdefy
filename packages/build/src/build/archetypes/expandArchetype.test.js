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

import { resolveConfigLocation } from '@lowdefy/errors';

import expandArchetype from './expandArchetype.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

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

const experimentalOn = { config: { experimental: { archetypes: true } } };

function pageContext(overrides = {}) {
  return {
    pageId: 'controls',
    rootBlockId: 'controls',
    context: {
      collections,
      keyMap: {},
      lowdefyConfig: experimentalOn,
      handleWarning: () => {},
    },
    ...overrides,
  };
}

test('expandArchetype rewrites a ListPage root into its layout with blocks and requests', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls', columns: ['title', 'status'] },
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
  expandArchetype(block, {
    pageId: 'x',
    rootBlockId: 'x',
    context: { collections, lowdefyConfig: {} },
  });
  expect(block.type).toBe('Box');
  expect(block.properties).toEqual({ a: 1 });
});

test('expandArchetype errors when an archetype is used on a nested block', () => {
  const block = {
    id: 'nested',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls' },
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(/can only be a page's root type/);
});

test('expandArchetype rejects an unknown archetype prop with a suggestion', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls', column: ['title'] },
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(/has no prop "column".*columns/s);
});

test('expandArchetype requires the collection prop', () => {
  const block = { id: 'controls', type: 'ListPage', '~k': 'k1', props: {} };
  expect(() => expandArchetype(block, pageContext())).toThrow(/requires prop "collection"/);
});

test('expandArchetype rejects an operator-valued prop loudly', () => {
  // The generator runs at build; an operator prop cannot be honoured and must
  // not silently fall back to the prop default.
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls', title: { _state: 'page_title' } },
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
    props: { collection: 'controls', pageSize: 25 },
  };
  expandArchetype(block, pageContext());
  expect(block.requests[0].properties.options.limit).toBe(25);
});

test('expandArchetype refuses to build an archetype without the experimental flag', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls' },
  };
  expect(() =>
    expandArchetype(block, {
      pageId: 'controls',
      rootBlockId: 'controls',
      context: { collections, lowdefyConfig: {} },
    })
  ).toThrow(
    /is experimental and must be enabled with "config.experimental.archetypes: true".*may change within a minor release/s
  );
  // The declaration is left as the author wrote it.
  expect(block.type).toBe('ListPage');
});

test('expandArchetype refuses to discard requests the author declared on the page root', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls' },
    requests: [{ id: 'frameworks', type: 'MongoDBFind', connectionId: 'controls' }],
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(
    /generates the page's "requests", so the page may not declare its own.*lowdefy expand controls/s
  );
});

test('expandArchetype refuses to discard events the author declared on the page root', () => {
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls' },
    events: { onInit: [{ id: 'a', type: 'SetState', params: {} }] },
  };
  expect(() => expandArchetype(block, pageContext())).toThrow(
    /generates the page's "events", so the page may not declare its own/
  );
});

test('expandArchetype passes the archetype slots to the generator and removes the key', () => {
  const footer = { id: 'note', type: 'Paragraph', properties: { content: 'note' } };
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls', columns: ['title'] },
    slots: { footer: { blocks: [footer] } },
  };
  expandArchetype(block, pageContext());
  expect(block.slots).toBeUndefined();
  expect(block.blocks[block.blocks.length - 1]).toBe(footer);
});

test('expandArchetype still reads "properties:" for one release, with a deprecation warning', () => {
  const warnings = [];
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    properties: { collection: 'controls', columns: ['title'] },
  };
  expandArchetype(
    block,
    pageContext({
      context: {
        collections,
        lowdefyConfig: experimentalOn,
        handleWarning: (w) => warnings.push(w),
      },
    })
  );
  expect(block.type).toBe('Box');
  expect(block.requests).toHaveLength(1);
  expect(warnings).toHaveLength(1);
  expect(warnings[0].message).toMatch(
    /"properties:", which is deprecated for archetypes.*"props:"/
  );
  expect(warnings[0].checkSlug).toBe('archetype');
});

test('expandArchetype prefers "props:" over "properties:" when both are present', () => {
  const warnings = [];
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls', columns: ['title'] },
    properties: { collection: 'ignored' },
  };
  expandArchetype(
    block,
    pageContext({
      context: {
        collections,
        lowdefyConfig: experimentalOn,
        handleWarning: (w) => warnings.push(w),
      },
    })
  );
  expect(warnings).toHaveLength(0);
  expect(block.type).toBe('Box');
  expect(block.requests).toHaveLength(1);
});

// --- Instance keys (~k) ---

test('expandArchetype gives an author prop node placed in the generated tree its own key', () => {
  const keyMap = {
    k1: { key: 'root.pages[0:controls]', '~r': 'page', '~l': 4 },
    layoutProperties: {
      key: 'root.pages[0:controls].props.layout.properties',
      '~r': 'page',
      '~l': 8,
    },
  };
  const layoutProperties = { gap: 16 };
  setNonEnumerableProperty(layoutProperties, '~k', 'layoutProperties');
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls', layout: { properties: layoutProperties } },
  };
  const context = pageContext();
  context.context.keyMap = keyMap;
  expandArchetype(block, context);

  const generatedKey = block.properties['~k'];
  expect(generatedKey).not.toBe('layoutProperties');
  expect(keyMap[generatedKey]['~k_source']).toBe('layoutProperties');
  expect(keyMap[generatedKey]['~k_parent']).toBe('k1');
  expect(
    resolveConfigLocation({
      configKey: generatedKey,
      keyMap,
      refMap: { page: { path: 'pages/controls.yaml' } },
    })
  ).toEqual({
    source: 'pages/controls.yaml:8',
    config: 'root.pages[0:controls].props.layout.properties',
  });
});

test('expandArchetype leaves a slot filler with the key it was authored with', () => {
  const keyMap = {
    k1: { key: 'root.pages[0:controls]' },
    filler: { key: 'root.pages[0:controls].slots.header.blocks[0:new]' },
  };
  const filler = { id: 'new', type: 'Button' };
  setNonEnumerableProperty(filler, '~k', 'filler');
  const block = {
    id: 'controls',
    type: 'ListPage',
    '~k': 'k1',
    props: { collection: 'controls' },
    slots: { header: { blocks: [filler] } },
  };
  const context = pageContext();
  context.context.keyMap = keyMap;
  expandArchetype(block, context);

  expect(filler['~k']).toBe('filler');
});
