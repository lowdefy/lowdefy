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

import buildTestPage from '@lowdefy/build/buildTestPage';
import { expect, test } from 'vitest';

import Block from '../../src/Block.js';
import getContext from '../../src/getContext.js';
import testContext from '../testContext.js';

// A page's config is copied once, when its context is created. Every container and list row reads
// that one copy, so these tests check that no block can reach another's config through it.

const lowdefy = { pageId: 'one' };

// The root block's slot config in the context's copy.
const rootConfig = (context) => context._internal.RootSlots.slots.root.blocks[0].slots;

const listPage = () => ({
  id: 'root',
  type: 'Box',
  events: {
    onInit: [
      {
        id: 'init',
        type: 'SetState',
        params: { list: [{ text: 'a' }, { text: 'b' }] },
      },
    ],
  },
  blocks: [
    {
      id: 'list',
      type: 'List',
      blocks: [
        {
          id: 'list.$.box',
          type: 'Box',
          blocks: [
            {
              id: 'list.$.text',
              type: 'TextInput',
              properties: {
                index: { _index: 0 },
                mirror: { _state: 'list.$.text' },
              },
            },
          ],
        },
      ],
    },
  ],
});

test('nested containers read the one copy of the page config', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'outer',
        type: 'Box',
        blocks: [
          {
            id: 'inner',
            type: 'Box',
            blocks: [{ id: 'deep', type: 'TextInput', properties: { title: 'Deep' } }],
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig: structuredClone(pageConfig) });
  const { deep, inner, outer } = context._internal.RootSlots.map;
  const root = context._internal.RootSlots.slots.root.blocks[0];
  const outerConfig = root.slots.content.blocks[0];
  const innerConfig = outerConfig.slots.content.blocks[0];
  const deepConfig = innerConfig.slots.content.blocks[0];

  expect(outer.slots).toBe(outerConfig.slots);
  expect(inner.slots).toBe(innerConfig.slots);
  expect(deep.properties).toBe(deepConfig.properties);
  expect(deep.eval.properties).toEqual({ title: 'Deep' });

  // The copy is the context's own: the fetched page config is a different object, and mounting
  // left both of them as config, with no Block instances written into their slots.
  expect(deep.properties).not.toBe(
    context._internal.pageConfig.slots.content.blocks[0].slots.content.blocks[0].slots.content
      .blocks[0].properties
  );
  expect(context._internal.pageConfig).toEqual(buildTestPage({ pageConfig }));
  expect(deepConfig).not.toBeInstanceOf(Block);
  expect(innerConfig.slots.content.blocks).toEqual([deepConfig]);
});

test('list rows share their config and evaluate apart', async () => {
  const context = await testContext({ lowdefy, pageConfig: listPage() });
  const { map } = context._internal.RootSlots;
  const list = map.list;
  const row0 = map['list.0.text'];
  const row1 = map['list.1.text'];

  expect(row0.properties).toBe(row1.properties);
  expect(map['list.0.box'].slots).toBe(map['list.1.box'].slots);
  expect(row0.eval.properties).toEqual({ index: 0, mirror: 'a' });
  expect(row1.eval.properties).toEqual({ index: 1, mirror: 'b' });

  // Each row holds its own slot objects and Block instances; the config's slot still holds config.
  const [rowSlots0, rowSlots1] = list.subSlots;
  expect(rowSlots0.slots).not.toBe(rowSlots1.slots);
  expect(rowSlots0.slots.content).not.toBe(list.slots.content);
  expect(rowSlots0.slots.content.blocks[0]).toBe(map['list.0.box']);
  expect(rowSlots1.slots.content.blocks[0]).toBe(map['list.1.box']);
  expect(list.slots.content.blocks).toHaveLength(1);
  expect(list.slots.content.blocks[0]).not.toBeInstanceOf(Block);
  expect(list.slots.content.blocks[0].blockId).toEqual('list.$.box');

  // Rows keep evaluating apart once their shared config's operator tree is compiled (the second
  // parse). Evaluated output is a fresh tree on each pass, so a block that changes its own output
  // leaves the config and the other row alone.
  row0.propertiesEval.output.mirror = 'changed by row 0';
  row0.eval.properties.index = 99;
  row1.setValue('c');
  row1.setValue('d');
  row0.setValue('e');
  expect(row0.eval.properties).toEqual({ index: 0, mirror: 'e' });
  expect(row1.eval.properties).toEqual({ index: 1, mirror: 'd' });
  expect(row0.properties).toEqual({
    index: { _index: 0 },
    mirror: { _state: 'list.$.text' },
  });
  expect(JSON.stringify(rootConfig(context))).not.toContain('changed by row 0');
});

test('rows added and moved after mount build from the untouched config', async () => {
  const context = await testContext({ lowdefy, pageConfig: listPage() });
  const { map } = context._internal.RootSlots;
  const list = map.list;

  list.pushItem();
  list.unshiftItem();
  map['list.3.text'].setValue('pushed');
  map['list.0.text'].setValue('unshifted');

  expect(context.state.list).toEqual([
    { text: 'unshifted' },
    { text: 'a' },
    { text: 'b' },
    { text: 'pushed' },
  ]);
  [0, 1, 2, 3].forEach((i) => {
    expect(map[`list.${i}.text`].eval.properties).toEqual({
      index: i,
      mirror: context.state.list[i].text,
    });
    expect(map[`list.${i}.text`].properties).toBe(map['list.0.text'].properties);
  });
  list.removeItem(1);
  expect(map['list.1.text'].eval.properties).toEqual({ index: 1, mirror: 'b' });
  expect(list.slots.content.blocks[0]).not.toBeInstanceOf(Block);
  expect(list.subSlots).toHaveLength(3);
});

test('a write into the shared config throws where the config is frozen', async () => {
  const context = await testContext({ lowdefy, pageConfig: listPage() });
  const { map } = context._internal.RootSlots;
  const list = map.list;
  const row0 = map['list.0.text'];

  expect(() => {
    row0.properties.index = 1;
  }).toThrow(TypeError);
  expect(() => {
    row0.properties.mirror._state = 'list.1.text';
  }).toThrow(TypeError);
  expect(() => list.slots.content.blocks.push({ id: 'extra', type: 'Box' })).toThrow(TypeError);
  expect(map['list.1.text'].eval.properties).toEqual({ index: 1, mirror: 'b' });

  // Only the config is frozen: the fetched page config, and the slot objects each Slots builds to
  // hold its Block instances, stay writable.
  expect(Object.isFrozen(context._internal.pageConfig)).toBe(false);
  expect(Object.isFrozen(list.subSlots[0].slots.content)).toBe(false);
});

test('page instances of one page config each copy it', async () => {
  const lowdefyApp = {
    contexts: {},
    inputs: {},
    pageInstances: {},
    pathMemory: new Map(),
    _internal: {
      displayMessage: () => () => {},
      translate: (key) => key,
      operators: {},
      actions: {},
      blockComponents: { Box: {}, TextInput: {} },
      blockMetas: {
        Box: { category: 'container' },
        TextInput: { category: 'input', valueType: 'string' },
      },
    },
  };
  const config = buildTestPage({
    pageConfig: {
      id: 'ticket',
      type: 'Box',
      blocks: [{ id: 'title', type: 'TextInput', properties: { label: 'Title' } }],
    },
  });
  config.path = 'tickets/{ticket_id}';
  const resetContext = { reset: false, setReset: () => {} };
  const one = getContext({
    config,
    lowdefy: lowdefyApp,
    pathParams: { ticket_id: '1' },
    resetContext,
  });
  const two = getContext({
    config,
    lowdefy: lowdefyApp,
    pathParams: { ticket_id: '2' },
    resetContext,
  });

  expect(one).not.toBe(two);
  const titleOne = one._internal.RootSlots.map.title;
  const titleTwo = two._internal.RootSlots.map.title;
  expect(titleOne.properties).toEqual({ label: 'Title' });
  expect(titleOne.properties).not.toBe(titleTwo.properties);
  expect(titleOne.properties).not.toBe(config.slots.content.blocks[0].properties);
  // Without freezeConfig, as in production, nothing is frozen.
  expect(Object.isFrozen(titleOne.properties)).toBe(false);
});
