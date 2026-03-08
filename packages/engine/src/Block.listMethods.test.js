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

import testContext from '../test/testContext.js';

const lowdefy = {
  _internal: {
    actions: {},
  },
};

test('pushItem without initial value adds null', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: ['a'] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.pushItem();
  expect(context.state).toEqual({ list: ['a', null] });
});

test('pushItem with initial value sets the value in state', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ name: 'first' }] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.name',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  expect(context.state).toEqual({ list: [{ name: 'first' }] });
  const list = context._internal.RootSlots.map['list'];
  list.pushItem({ name: 'second', color: 'blue' });
  expect(context.state).toEqual({
    list: [{ name: 'first' }, { name: 'second', color: 'blue' }],
  });
});

test('pushItem with string initial value sets the value in state', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: ['a'] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.pushItem('b');
  expect(context.state).toEqual({ list: ['a', 'b'] });
});

test('pushItem multiple times with initial values', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.title',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.pushItem({ title: 'Card 1' });
  list.pushItem({ title: 'Card 2' });
  list.pushItem({ title: 'Card 3' });
  expect(context.state).toEqual({
    list: [{ title: 'Card 1' }, { title: 'Card 2' }, { title: 'Card 3' }],
  });
});

test('unshiftItem without initial value adds null at front', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: ['a'] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.unshiftItem();
  expect(context.state).toEqual({ list: [null, 'a'] });
});

test('unshiftItem with initial value sets the value at index 0', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ name: 'existing' }] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.name',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  expect(context.state).toEqual({ list: [{ name: 'existing' }] });
  const list = context._internal.RootSlots.map['list'];
  list.unshiftItem({ name: 'new first', priority: 'high' });
  expect(context.state).toEqual({
    list: [{ name: 'new first', priority: 'high' }, { name: 'existing' }],
  });
});

test('unshiftItem with string initial value', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: ['b'] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.unshiftItem('a');
  expect(context.state).toEqual({ list: ['a', 'b'] });
});

test('pushItem and removeItem with initial values', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.name',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.pushItem({ name: 'first' });
  list.pushItem({ name: 'second' });
  expect(context.state).toEqual({
    list: [{ name: 'first' }, { name: 'second' }],
  });
  list.removeItem(0);
  expect(context.state).toEqual({
    list: [{ name: 'second' }],
  });
});

test('pushItem with undefined initial value adds null (same as no args)', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: ['a'] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const list = context._internal.RootSlots.map['list'];
  list.pushItem(undefined);
  expect(context.state).toEqual({ list: ['a', null] });
});
