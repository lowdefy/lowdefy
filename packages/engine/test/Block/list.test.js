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

test('list block no init', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        areas: {
          content: {
            blocks: [
              {
                type: 'TextInput',
                id: 'list.$.text',
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
  expect(list.value).toBe(undefined);
  expect(context.state).toEqual({ list: [] });
});

test('list block with init', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ text: 'hello' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const text0 = context._internal.RootBlocks.map['list.0.text'];
  expect(text0.value).toEqual('hello');
  expect(context.state).toEqual({ list: [{ text: 'hello' }] });
});

test('list block init with non array', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: 'hello' },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [] });
});

test('list block no init push item', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;

  expect(list.value).toBe(undefined);
  expect(context.state).toEqual({ list: [] });
  list.pushItem();
  const text0 = context._internal.RootBlocks.map['list.0.text'];

  expect(text0.value).toBe(null);
  expect(context.state).toEqual({ list: [{ text: null }] });
});

test('list block with init move item up', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [0, 1, 2, 3, 4, 5] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'NumberInput',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  expect(context.state).toEqual({ list: [0, 1, 2, 3, 4, 5] });
  list.moveItemUp(0);
  expect(context.state).toEqual({ list: [0, 1, 2, 3, 4, 5] });
  list.moveItemUp(1);
  expect(context.state).toEqual({ list: [1, 0, 2, 3, 4, 5] });
});

test('list block with init move item down', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [0, 1, 2, 3, 4, 5] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'NumberInput',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  expect(context.state).toEqual({ list: [0, 1, 2, 3, 4, 5] });
  list.moveItemDown(5);
  expect(context.state).toEqual({ list: [0, 1, 2, 3, 4, 5] });
  list.moveItemDown(1);
  expect(context.state).toEqual({ list: [0, 2, 1, 3, 4, 5] });
});

test('list block no init unshift item to start', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list, root } = context._internal.RootBlocks.map;
  const BlocksContainingList = context._internal.RootBlocks.subBlocks[root.id][0];

  expect(list.value).toBe(undefined);
  expect(context.state).toEqual({ list: [] });
  list.unshiftItem();
  expect(context.state).toEqual({ list: [{ text: null }] });
  const text0 = context._internal.RootBlocks.map['list.0.text'];
  const ListSubblocks0 = BlocksContainingList.subBlocks[list.id][0];

  text0.setValue('first');
  expect(context.state).toEqual({ list: [{ text: 'first' }] });
  expect(ListSubblocks0.arrayIndices).toEqual([0]);

  list.unshiftItem();
  expect(context.state).toEqual({ list: [{ text: null }, { text: 'first' }] });
  expect(ListSubblocks0.arrayIndices).toEqual([1]);

  // get new references to Blocks classes at index 0 and 1
  const NewListSubblocks0 = BlocksContainingList.subBlocks[list.id][0];
  const NewListSubblocks1 = BlocksContainingList.subBlocks[list.id][1];

  expect(NewListSubblocks0.arrayIndices).toEqual([0]);
  expect(NewListSubblocks1.arrayIndices).toEqual([1]);
  // first Blocks class should have moved to index 1
  expect(ListSubblocks0).toBe(NewListSubblocks1);

  // original text0
  expect(text0.value).toEqual('first');
  const newText0 = context._internal.RootBlocks.map['list.0.text'];
  expect(newText0.value).toEqual(null);
});

test('list block no init unshift item to start, block id not in array', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'other.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list, root } = context._internal.RootBlocks.map;
  const BlocksContainingList = context._internal.RootBlocks.subBlocks[root.id][0];
  expect(context.state).toEqual({ list: [] });
  list.unshiftItem();
  expect(context.state).toEqual({ other: [null] });
  const text0 = context._internal.RootBlocks.map['other.0'];
  text0.setValue('first');
  expect(context.state).toEqual({ other: ['first'] });
  list.unshiftItem();

  const NewListSubblocks0 = BlocksContainingList.subBlocks[list.id][0];
  const NewListSubblocks1 = BlocksContainingList.subBlocks[list.id][1];

  expect(NewListSubblocks0.arrayIndices).toEqual([0]);
  expect(NewListSubblocks1.arrayIndices).toEqual([1]);
  expect(text0.value).toEqual('first');
  const newText0 = context._internal.RootBlocks.map['other.0'];
  expect(newText0.value).toEqual(null);

  expect(context.state).toEqual({ other: [null, 'first'] });
});

test('list block unshift item clear all previous values', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: {
            list: [
              {
                text: 'A',
                innerList: [0],
              },
              {
                text: 'C',
                innerList: [1, 2],
              },
            ],
          },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
          {
            type: 'List',
            id: 'list.$.innerList',
            blocks: [
              {
                type: 'NumberInput',
                id: 'list.$.innerList.$',
              },
            ],
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  expect(context.state).toEqual({
    list: [
      {
        text: 'A',
        innerList: [0],
      },
      {
        text: 'C',
        innerList: [1, 2],
      },
    ],
  });
  list.unshiftItem();
  expect(context.state).toEqual({
    list: [
      {
        text: null,
        innerList: [],
      },
      {
        text: 'A',
        innerList: [0],
      },
      {
        text: 'C',
        innerList: [1, 2],
      },
    ],
  });
});

test('list block with init push item', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ text: 'a' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  expect(context.state).toEqual({ list: [{ text: 'a' }] });
  list.pushItem();
  expect(context.state).toEqual({ list: [{ text: 'a' }, { text: null }] });
});

test('list block with init including extra data and push item', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ b: 'b', c: 'c' }], d: 'd' },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.b',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  expect(context.state).toEqual({ list: [{ b: 'b', c: 'c' }], d: 'd' });
  list.pushItem();
  expect(context.state).toEqual({ list: [{ b: 'b', c: 'c' }, { b: null }], d: 'd' });
});

test('list block no init push item, with enforced input type', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [] });
  const { list } = context._internal.RootBlocks.map;
  list.pushItem();
  expect(context.state).toEqual({ list: [{ text: null }] });
});

test('list block with rec visible in parent blocks', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ b: 'b', a: 'a' }], c: 'c' },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.a',
            visible: true,
          },
          {
            type: 'TextInput',
            id: 'list.$.b',
            visible: {
              '_mql.test': { on: { _state: true }, test: { 'list.0.a': 'show b' } },
            },
          },
        ],
      },
      {
        type: 'TextInput',
        id: 'c',
        visible: {
          '_mql.test': { on: { _state: true }, test: { 'list.0.b': { $exists: true } } },
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const a0 = context._internal.RootBlocks.map['list.0.a'];
  expect(context.state).toEqual({ list: [{ a: 'a' }] });
  a0.setValue('show b');
  expect(context.state).toEqual({ list: [{ b: 'b', a: 'show b' }], c: 'c' });
});

test('list block with visible', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ a: 'a' }], swtch: true },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        visible: { _state: 'swtch' },
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.a',
          },
        ],
      },
      {
        type: 'Switch',
        id: 'swtch',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { swtch } = context._internal.RootBlocks.map;

  expect(context.state).toEqual({ list: [{ a: 'a' }], swtch: true });
  swtch.setValue(false);
  expect(context.state).toEqual({ swtch: false });
  swtch.setValue(true);
  expect(context.state).toEqual({ list: [{ a: 'a' }], swtch: true });
});

test('toggle list object field visibility with index', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: {
            list: [
              { text: 'a1', swtch: true },
              { text: 'a2', swtch: false },
            ],
          },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
            visible: { _state: 'list.$.swtch' },
          },
          {
            type: 'Switch',
            id: 'list.$.swtch',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const swtch1 = context._internal.RootBlocks.map['list.1.swtch'];

  expect(context.state).toEqual({ list: [{ text: 'a1', swtch: true }, { swtch: false }] });
  swtch1.setValue(true);
  expect(context.state).toEqual({
    list: [
      { text: 'a1', swtch: true },
      { text: 'a2', swtch: true },
    ],
  });
  swtch1.setValue(false);
  expect(context.state).toEqual({ list: [{ text: 'a1', swtch: true }, { swtch: false }] });
});

test('primitive list block no init', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'List',
            id: 'list',
            blocks: [
              {
                type: 'NumberInput',
                id: 'list.$',
              },
            ],
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [] });
});

test('primitive list block with init', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [1, 2, 3] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'NumberInput',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const number0 = context._internal.RootBlocks.map['list.0'];
  expect(number0.value).toBe(1);
  expect(context.state).toEqual({ list: [1, 2, 3] });
});

test('primitive list block with init, push item and setValue', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [1, 2, 3] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'NumberInput',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [1, 2, 3] });
  const { list } = context._internal.RootBlocks.map;
  list.pushItem();
  expect(context.state).toEqual({ list: [1, 2, 3, null] });
  const a3 = context._internal.RootBlocks.map['list.3'];
  a3.setValue(-1);
  expect(context.state).toEqual({ list: [1, 2, 3, -1] });
});

test('primitive list block with init, push item and setValue', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [1, 2, 3] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'NumberInput',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [1, 2, 3] });
  const { list } = context._internal.RootBlocks.map;
  list.pushItem();
  expect(context.state).toEqual({ list: [1, 2, 3, null] });
  const a3 = context._internal.RootBlocks.map['list.3'];
  a3.setValue(-1);
  expect(context.state).toEqual({ list: [1, 2, 3, -1] });
});

test('primitive list block with init and push item with enforced input type', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [true, true, true] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'Switch',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [true, true, true] });
  const { list } = context._internal.RootBlocks.map;
  list.pushItem();
  expect(context.state).toEqual({ list: [true, true, true, false] });
});

test('list block with nested primitive array with init, push item enforced type on inputs and setValue', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ innerList: [true, true, true], text: 'text' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'List',
            id: 'list.$.innerList',
            blocks: [
              {
                type: 'Switch',
                id: 'list.$.innerList.$',
              },
            ],
          },
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [{ innerList: [true, true, true], text: 'text' }] });
  const { list } = context._internal.RootBlocks.map;
  list.pushItem();
  expect(context.state).toEqual({
    list: [
      { innerList: [true, true, true], text: 'text' },
      { innerList: [], text: null },
    ],
  });
  const innerList1 = context._internal.RootBlocks.map['list.1.innerList'];
  innerList1.pushItem();
  expect(context.state).toEqual({
    list: [
      { innerList: [true, true, true], text: 'text' },
      { innerList: [false], text: null },
    ],
  });
  const switch_1_0 = context._internal.RootBlocks.map['list.1.innerList.0'];
  switch_1_0.setValue(true);
  expect(context.state).toEqual({
    list: [
      { innerList: [true, true, true], text: 'text' },
      { innerList: [true], text: null },
    ],
  });
});

test('list block with nested primitive array with init, push item and setValue', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ innerList: [1, 2, 3], text: 'text' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'List',
            id: 'list.$.innerList',
            blocks: [
              {
                type: 'NumberInput',
                id: 'list.$.innerList.$',
              },
            ],
          },
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [{ innerList: [1, 2, 3], text: 'text' }] });
  const { list } = context._internal.RootBlocks.map;
  list.pushItem();
  expect(context.state).toEqual({
    list: [
      { innerList: [1, 2, 3], text: 'text' },
      { innerList: [], text: null },
    ],
  });
  const innerList1 = context._internal.RootBlocks.map['list.1.innerList'];
  innerList1.pushItem();
  expect(context.state).toEqual({
    list: [
      { innerList: [1, 2, 3], text: 'text' },
      { innerList: [null], text: null },
    ],
  });
  const number_1_0 = context._internal.RootBlocks.map['list.1.innerList.0'];
  number_1_0.setValue(-1);
  expect(context.state).toEqual({
    list: [
      { innerList: [1, 2, 3], text: 'text' },
      { innerList: [-1], text: null },
    ],
  });
});

test('list block with init remove item of first item and more than two values', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ text: '0' }, { text: '1' }, { text: '2' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  expect(context.state).toEqual({ list: [{ text: '0' }, { text: '1' }, { text: '2' }] });
  list.removeItem(0);
  expect(context.state).toEqual({ list: [{ text: '1' }, { text: '2' }] });
  const blocksContainingList =
    context._internal.RootBlocks.subBlocks[context._internal.RootBlocks.map.root.id][0];
  const listSubblocksList = blocksContainingList.subBlocks[list.id];
  expect(listSubblocksList[0].arrayIndices).toEqual([0]);
  expect(listSubblocksList[1].arrayIndices).toEqual([1]);
  expect(listSubblocksList.length).toEqual(2);
});

test('list block remove item, add item does not have previous item value ', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ text: '0' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  const blocksContainingList =
    context._internal.RootBlocks.subBlocks[context._internal.RootBlocks.map.root.id][0];
  const listSubblocksList = blocksContainingList.subBlocks[list.id];

  expect(context.state).toEqual({ list: [{ text: '0' }] });
  list.removeItem(0);
  expect(context.state).toEqual({ list: [] });
  expect(listSubblocksList.length).toEqual(0);
  list.pushItem();
  expect(context.state).toEqual({ list: [{ text: null }] });
  expect(listSubblocksList.length).toEqual(1);
});

test('list block with init remove item and set existing item values', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ text: '0' }, { text: '1' }, { text: '2' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootBlocks.map;
  const text0 = context._internal.RootBlocks.map['list.0.text'];
  const text2 = context._internal.RootBlocks.map['list.2.text'];
  const blocksContainingList =
    context._internal.RootBlocks.subBlocks[context._internal.RootBlocks.map.root.id][0];
  const listSubblocksList = blocksContainingList.subBlocks[list.id];

  expect(context.state).toEqual({ list: [{ text: '0' }, { text: '1' }, { text: '2' }] });
  expect(listSubblocksList[0].arrayIndices).toEqual([0]);
  expect(listSubblocksList[1].arrayIndices).toEqual([1]);
  expect(listSubblocksList[2].arrayIndices).toEqual([2]);

  list.removeItem(1);
  expect(context.state).toEqual({ list: [{ text: '0' }, { text: '2' }] });
  expect(listSubblocksList[0].arrayIndices).toEqual([0]);
  expect(listSubblocksList[1].arrayIndices).toEqual([1]);
  expect(listSubblocksList.length).toEqual(2);

  text0.setValue('new 0');
  text2.setValue('new 2');
  expect(context.state).toEqual({ list: [{ text: 'new 0' }, { text: 'new 2' }] });

  list.pushItem();
  expect(context.state).toEqual({ list: [{ text: 'new 0' }, { text: 'new 2' }, { text: null }] });
  expect(listSubblocksList.length).toEqual(3);
});

test('primitive list block with init remove item', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [0, 1, 2, 3, 4, 5, 6, 7] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'NumberInput',
            id: 'list.$',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [0, 1, 2, 3, 4, 5, 6, 7] });

  const { list } = context._internal.RootBlocks.map;
  const num3 = context._internal.RootBlocks.map['list.3'];
  const num5 = context._internal.RootBlocks.map['list.5'];
  const blocksContainingList =
    context._internal.RootBlocks.subBlocks[context._internal.RootBlocks.map.root.id][0];
  const listSubblocksList = blocksContainingList.subBlocks[list.id];

  const B3 = listSubblocksList[3];
  const B4 = listSubblocksList[4];
  const B5 = listSubblocksList[5];
  const B6 = listSubblocksList[6];
  expect(B3.arrayIndices).toEqual([3]);
  expect(B4.arrayIndices).toEqual([4]);
  expect(B5.arrayIndices).toEqual([5]);
  expect(B6.arrayIndices).toEqual([6]);

  list.removeItem(4);
  expect(context.state).toEqual({ list: [0, 1, 2, 3, 5, 6, 7] });
  expect(B3.arrayIndices).toEqual([3]);
  expect(B4.arrayIndices).toEqual([4]);
  expect(B5.arrayIndices).toEqual([4]);
  expect(B6.arrayIndices).toEqual([5]);

  list.pushItem();
  num3.setValue(30);
  num5.setValue(50);
  expect(context.state).toEqual({ list: [0, 1, 2, 30, 50, 6, 7, null] });
});

test('nested list', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: {
            list: [
              { text: 'b0' },
              { text: 'b1', swtch: true },
              { text: 'b2', innerList: [{ innerInnerList: [1, 2, 3, 4, 5, 6, 7] }], swtch: true },
              { text: 'b3', innerList: [{ innerInnerList: [1, 2, 3] }] },
              { text: 'b4', swtch: false },
            ],
          },
        },
      ],
    },
    blocks: [
      {
        type: 'Paragraph',
        id: 'par',
      },
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
          },
          {
            type: 'Switch',
            id: 'list.$.swtch',
          },
          {
            type: 'Box',
            id: 'list.$.container',
            visible: { _state: 'list.$.swtch' },
            blocks: [
              {
                type: 'Paragraph',
                id: 'list.$.par',
              },
              {
                type: 'List',
                id: 'list.$.innerList',
                blocks: [
                  {
                    type: 'List',
                    id: 'list.$.innerList.$.innerInnerList',
                    blocks: [
                      {
                        type: 'NumberInput',
                        id: 'list.$.innerList.$.innerInnerList.$',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({
    list: [
      { text: 'b0', swtch: false },
      { text: 'b1', innerList: [], swtch: true },
      { text: 'b2', innerList: [{ innerInnerList: [1, 2, 3, 4, 5, 6, 7] }], swtch: true },
      { text: 'b3', swtch: false },
      { text: 'b4', swtch: false },
    ],
  });

  const { list } = context._internal.RootBlocks.map;
  const container2 = context._internal.RootBlocks.map['list.2.container'];
  const swtch2 = context._internal.RootBlocks.map['list.2.swtch'];
  const swtch3 = context._internal.RootBlocks.map['list.3.swtch'];

  swtch2.setValue(false);
  expect(container2.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({
    list: [
      { text: 'b0', swtch: false },
      { text: 'b1', innerList: [], swtch: true },
      { text: 'b2', swtch: false },
      { text: 'b3', swtch: false },
      { text: 'b4', swtch: false },
    ],
  });

  swtch2.setValue(true);
  expect(container2.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({
    list: [
      { text: 'b0', swtch: false },
      { text: 'b1', innerList: [], swtch: true },
      { text: 'b2', innerList: [{ innerInnerList: [1, 2, 3, 4, 5, 6, 7] }], swtch: true },
      { text: 'b3', swtch: false },
      { text: 'b4', swtch: false },
    ],
  });

  list.removeItem(2);
  expect(context.state).toEqual({
    list: [
      { text: 'b0', swtch: false },
      { text: 'b1', innerList: [], swtch: true },
      { text: 'b3', swtch: false },
      { text: 'b4', swtch: false },
    ],
  });

  swtch3.setValue(true);
  expect(context.state).toEqual({
    list: [
      { text: 'b0', swtch: false },
      { text: 'b1', innerList: [], swtch: true },
      { text: 'b3', innerList: [{ innerInnerList: [1, 2, 3] }], swtch: true },
      { text: 'b4', swtch: false },
    ],
  });

  list.pushItem();
  expect(context.state).toEqual({
    list: [
      { text: 'b0', swtch: false },
      { text: 'b1', innerList: [], swtch: true },
      { text: 'b3', innerList: [{ innerInnerList: [1, 2, 3] }], swtch: true },
      { text: 'b4', swtch: false },
      { text: null, swtch: false },
    ],
  });
});
