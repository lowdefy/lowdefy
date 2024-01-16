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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId };

test('two areas in block', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    areas: {
      key1: {
        blocks: [
          {
            type: 'Switch',
            id: 'swtch1',
          },
        ],
      },
      key2: {
        blocks: [
          {
            type: 'Switch',
            id: 'swtch2',
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { swtch1, swtch2 } = context._internal.RootBlocks.map;
  expect(swtch1.value).toBe(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: false });
  swtch1.setValue(true);
  expect(swtch1.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(swtch2.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: true });
});

test('parse values across areas with same block id and visible switching block type', async () => {
  // TODO: FIX? when a input with a duplicate id goes invisible it remove the value from state, yet the duplicate block is still visible.
  const pageConfig = {
    id: 'root',
    type: 'Box',
    areas: {
      key1: {
        blocks: [
          {
            type: 'Switch',
            id: 'swtch',
            visible: { _not: { _state: 'hide1' } },
          },
        ],
      },
      key2: {
        blocks: [
          {
            type: 'Switch',
            id: 'swtch',
            visible: { _not: { _state: 'hide2' } },
          },
        ],
      },
      key3: {
        blocks: [
          {
            type: 'Switch',
            id: 'hide1',
          },
          {
            type: 'Switch',
            id: 'hide2',
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { hide1, hide2 } = context._internal.RootBlocks.map;
  const swtch1 = context._internal.RootBlocks.subBlocks['page:root'][0].areas.key1.blocks[0];
  const swtch2 = context._internal.RootBlocks.subBlocks['page:root'][0].areas.key2.blocks[0];
  expect(swtch1.visibleEval.output).toBe(true);
  expect(swtch2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ swtch: false, hide1: false, hide2: false });

  hide1.setValue(true);
  expect(swtch1.visibleEval.output).toBe(false);
  expect(swtch2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ swtch: false, hide1: true, hide2: false });

  swtch2.setValue(true);
  hide2.setValue(true);
  expect(swtch1.visibleEval.output).toBe(false);
  expect(swtch2.visibleEval.output).toBe(false);
  expect(context.state).toEqual({ hide1: true, hide2: true });

  hide2.setValue(false);
  expect(swtch1.visibleEval.output).toBe(false);
  expect(swtch2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ swtch: true, hide1: true, hide2: false });
});

test('areas inside list', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        areas: {
          key1: {
            blocks: [
              {
                type: 'Switch',
                id: 'list.$.swtchB',
              },
            ],
          },
          key2: {
            blocks: [
              {
                type: 'Switch',
                id: 'list.$.swtchA',
              },
            ],
          },
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;

  list.pushItem();
  const swtchA0 = context._internal.RootBlocks.map['list.0.swtchA'];
  const swtchB0 = context._internal.RootBlocks.map['list.0.swtchB'];
  expect(swtchA0.value).toBe(false);
  expect(swtchB0.value).toBe(false);

  swtchA0.setValue(true);
  expect(context.state).toEqual({ list: [{ swtchA: true, swtchB: false }] });

  list.pushItem();
  const swtchA1 = context._internal.RootBlocks.map['list.1.swtchA'];
  const swtchB1 = context._internal.RootBlocks.map['list.1.swtchB'];

  expect(swtchA1.value).toBe(false);
  expect(swtchB1.value).toBe(false);
  swtchB1.setValue(true);
  expect(context.state).toEqual({
    list: [
      { swtchA: true, swtchB: false },
      { swtchA: false, swtchB: true },
    ],
  });
});
