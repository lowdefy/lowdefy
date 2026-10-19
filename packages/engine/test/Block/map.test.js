/* eslint-disable dot-notation */

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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId };

test('all nested blocks present in map', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            y: 'y',
            a: [{ b: 'b0' }, { b: 'b1', c: [{ d: [1, 2, 3] }] }],
          },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'y',
      },
      {
        type: 'List',
        id: 'a',
        blocks: [
          {
            type: 'TextInput',
            id: 'a.$.b',
          },
          {
            type: 'Box',
            id: 'a.$.col',
            blocks: [
              {
                type: 'TextInput',
                id: 'a.$.t',
              },
              {
                type: 'List',
                id: 'a.$.c',
                blocks: [
                  {
                    type: 'List',
                    id: 'a.$.c.$.d',
                    blocks: [
                      {
                        type: 'NumberInput',
                        id: 'a.$.c.$.d.$',
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
  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set([
      'root',
      'y',
      'a',
      'a.0.b',
      'a.0.col',
      'a.0.t',
      'a.0.c',
      'a.1.b',
      'a.1.col',
      'a.1.t',
      'a.1.c',
      'a.1.c.0.d',
      'a.1.c.0.d.0',
      'a.1.c.0.d.1',
      'a.1.c.0.d.2',
    ])
  );
  Object.keys(context._internal.RootSlots.map).forEach((key) => {
    expect(context._internal.RootSlots.map[key].blockId).toEqual(key);
  });
});

test('unshiftItem item in list updates map', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            list: [0, 1],
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

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1'])
  );
  const { list } = context._internal.RootSlots.map;
  const originalL0 = context._internal.RootSlots.map['list.0'];
  const originalL1 = context._internal.RootSlots.map['list.1'];

  list.unshiftItem();

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2'])
  );
  const newL1 = context._internal.RootSlots.map['list.1'];
  const newL2 = context._internal.RootSlots.map['list.2'];

  expect(originalL0).toBe(newL1);
  expect(originalL1).toBe(newL2);
});

test('pushItem item in list updates map', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            list: [0],
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
  const { list } = context._internal.RootSlots.map;
  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0'])
  );
  const originalL0 = context._internal.RootSlots.map['list.0'];

  list.pushItem();

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1'])
  );
  const newL0 = context._internal.RootSlots.map['list.0'];
  expect(originalL0).toBe(newL0);
  expect(context._internal.RootSlots.map['list.1'].blockId).toEqual('list.1');
});

test('removeItem in list updates map', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            list: [0, 1, 2, 3],
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
  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );
  const { list } = context._internal.RootSlots.map;
  const L0 = context._internal.RootSlots.map['list.0'];
  const L2 = context._internal.RootSlots.map['list.2'];
  const L3 = context._internal.RootSlots.map['list.3'];

  list.removeItem(1);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L0);
  expect(context._internal.RootSlots.map['list.1']).toBe(L2);
  expect(context._internal.RootSlots.map['list.2']).toBe(L3);

  list.removeItem(0);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L2);
  expect(context._internal.RootSlots.map['list.1']).toBe(L3);

  list.removeItem(1);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L2);

  list.removeItem(0);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(new Set(['root', 'list']));
});

test('moveItemUp in list updates map', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            list: [0, 1, 2, 3],
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
  const { list } = context._internal.RootSlots.map;

  const L0 = context._internal.RootSlots.map['list.0'];
  const L1 = context._internal.RootSlots.map['list.1'];
  const L2 = context._internal.RootSlots.map['list.2'];
  const L3 = context._internal.RootSlots.map['list.3'];
  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );

  list.moveItemUp(1);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L1);
  expect(context._internal.RootSlots.map['list.1']).toBe(L0);
  expect(context._internal.RootSlots.map['list.2']).toBe(L2);
  expect(context._internal.RootSlots.map['list.3']).toBe(L3);

  list.moveItemUp(0);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L1);
  expect(context._internal.RootSlots.map['list.1']).toBe(L0);
  expect(context._internal.RootSlots.map['list.2']).toBe(L2);
  expect(context._internal.RootSlots.map['list.3']).toBe(L3);
});

test('moveItemDown in list updates map', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            list: [0, 1, 2, 3],
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
  const { list } = context._internal.RootSlots.map;

  const L0 = context._internal.RootSlots.map['list.0'];
  const L1 = context._internal.RootSlots.map['list.1'];
  const L2 = context._internal.RootSlots.map['list.2'];
  const L3 = context._internal.RootSlots.map['list.3'];

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );
  list.moveItemDown(1);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L0);
  expect(context._internal.RootSlots.map['list.1']).toBe(L2);
  expect(context._internal.RootSlots.map['list.2']).toBe(L1);
  expect(context._internal.RootSlots.map['list.3']).toBe(L3);

  list.moveItemDown(3);

  expect(new Set(Object.keys(context._internal.RootSlots.map))).toEqual(
    new Set(['root', 'list', 'list.0', 'list.1', 'list.2', 'list.3'])
  );
  expect(context._internal.RootSlots.map['list.0']).toBe(L0);
  expect(context._internal.RootSlots.map['list.1']).toBe(L2);
  expect(context._internal.RootSlots.map['list.2']).toBe(L1);
  expect(context._internal.RootSlots.map['list.3']).toBe(L3);
});

// Rows whose nested lists differ in length, so a row move changes which nested keys exist.
function createNestedListPage() {
  return {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { list: [{ sub: [1, 2, 3] }, { sub: [4] }] },
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
            id: 'list.$.sub',
            blocks: [{ type: 'NumberInput', id: 'list.$.sub.$' }],
          },
        ],
      },
      {
        type: 'Button',
        id: 'shorten',
        events: {
          onClick: [{ id: 'shorten', type: 'SetState', params: { list: [{ sub: [1] }] } }],
        },
      },
    ],
  };
}

function expectMapToHoldOnlyLiveBlocks(context, keys) {
  const { map } = context._internal.RootSlots;
  expect(Object.keys(map).sort()).toEqual([...keys].sort());
  Object.keys(map).forEach((key) => {
    expect(map[key].blockId).toEqual(key);
  });
}

test.each([
  ['moveItemDown', (list) => list.moveItemDown(0)],
  ['moveItemUp', (list) => list.moveItemUp(1)],
])('%s of rows with nested lists of different lengths leaves no stale keys', async (_, move) => {
  const context = await testContext({ lowdefy, pageConfig: createNestedListPage() });
  const { list } = context._internal.RootSlots.map;
  const firstRowLastItem = context._internal.RootSlots.map['list.0.sub.2'];

  move(list);

  expect(context.state.list).toEqual([{ sub: [4] }, { sub: [1, 2, 3] }]);
  expectMapToHoldOnlyLiveBlocks(context, [
    'root',
    'list',
    'shorten',
    'list.0.sub',
    'list.0.sub.0',
    'list.1.sub',
    'list.1.sub.0',
    'list.1.sub.1',
    'list.1.sub.2',
  ]);
  expect(context._internal.RootSlots.map['list.1.sub.2']).toBe(firstRowLastItem);
});

test('removeItem of a row with a longer nested list removes its nested blocks from the map', async () => {
  const context = await testContext({ lowdefy, pageConfig: createNestedListPage() });
  const { list } = context._internal.RootSlots.map;

  list.removeItem(0);

  expect(context.state.list).toEqual([{ sub: [4] }]);
  expectMapToHoldOnlyLiveBlocks(context, ['root', 'list', 'shorten', 'list.0.sub', 'list.0.sub.0']);
});

test('SetState that shortens a list removes the dropped rows from the map', async () => {
  const context = await testContext({ lowdefy, pageConfig: createNestedListPage() });
  const { shorten } = context._internal.RootSlots.map;

  await shorten.triggerEvent({ name: 'onClick' });

  expect(context.state.list).toEqual([{ sub: [1] }]);
  expectMapToHoldOnlyLiveBlocks(context, ['root', 'list', 'shorten', 'list.0.sub', 'list.0.sub.0']);
});
