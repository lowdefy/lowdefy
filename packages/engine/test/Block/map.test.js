/* eslint-disable dot-notation */

/*
   Copyright 2020 Lowdefy, Inc

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

import testContext from '../testContext';

const pageId = 'one';
const rootContext = {};

test('all nested blocks present in map', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'y',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'List',
            blockId: 'a',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'a.$.b',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                  {
                    type: 'Box',
                    blockId: 'a.$.col',
                    meta: {
                      category: 'container',
                    },
                    areas: {
                      content: {
                        blocks: [
                          {
                            type: 'TextInput',
                            blockId: 'a.$.t',
                            meta: {
                              category: 'display',
                            },
                          },
                          {
                            type: 'List',
                            blockId: 'a.$.c',
                            meta: {
                              category: 'list',
                              valueType: 'array',
                            },
                            areas: {
                              content: {
                                blocks: [
                                  {
                                    type: 'List',
                                    blockId: 'a.$.c.$.d',
                                    meta: {
                                      category: 'list',
                                      valueType: 'array',
                                    },
                                    areas: {
                                      content: {
                                        blocks: [
                                          {
                                            type: 'NumberInput',
                                            blockId: 'a.$.c.$.d.$',
                                            meta: {
                                              category: 'input',
                                              valueType: 'number',
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      y: 'y',
      a: [{ b: 'b0' }, { b: 'b1', c: [{ d: [1, 2, 3] }] }],
    },
  });
  expect(Object.keys(context.RootBlocks.map)).toEqual([
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
  ]);
  Object.keys(context.RootBlocks.map).forEach((key) => {
    expect(context.RootBlocks.map[key].blockId).toEqual(key);
  });
});

test('unshiftItem item in list updates map', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'NumberInput',
                    blockId: 'list.$',
                    meta: {
                      category: 'input',
                      valueType: 'number',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      list: [0, 1],
    },
  });

  expect(Object.keys(context.RootBlocks.map)).toEqual(['root', 'list', 'list.0', 'list.1']);
  const { list } = context.RootBlocks.map;
  const originalL0 = context.RootBlocks.map['list.0'];
  const originalL1 = context.RootBlocks.map['list.1'];

  list.unshiftItem();

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
  ]);
  const newL1 = context.RootBlocks.map['list.1'];
  const newL2 = context.RootBlocks.map['list.2'];

  expect(originalL0).toBe(newL1);
  expect(originalL1).toBe(newL2);
});

test('pushItem item in list updates map', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'NumberInput',
                    blockId: 'list.$',
                    meta: {
                      category: 'input',
                      valueType: 'number',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      list: [0],
    },
  });
  const { list } = context.RootBlocks.map;
  expect(Object.keys(context.RootBlocks.map)).toEqual(['root', 'list', 'list.0']);
  const originalL0 = context.RootBlocks.map['list.0'];

  list.pushItem();

  expect(Object.keys(context.RootBlocks.map)).toEqual(['root', 'list', 'list.0', 'list.1']);
  const newL0 = context.RootBlocks.map['list.0'];
  expect(originalL0).toBe(newL0);
  expect(context.RootBlocks.map['list.1'].blockId).toEqual('list.1');
});

test('removeItem in list updates map', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'NumberInput',
                    blockId: 'list.$',
                    meta: {
                      category: 'input',
                      valueType: 'number',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      list: [0, 1, 2, 3],
    },
  });
  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);
  const { list } = context.RootBlocks.map;
  const L0 = context.RootBlocks.map['list.0'];
  const L2 = context.RootBlocks.map['list.2'];
  const L3 = context.RootBlocks.map['list.3'];

  list.removeItem(1);

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
  ]);
  expect(context.RootBlocks.map['list.0']).toBe(L0);
  expect(context.RootBlocks.map['list.1']).toBe(L2);
  expect(context.RootBlocks.map['list.2']).toBe(L3);

  list.removeItem(0);

  expect(Object.keys(context.RootBlocks.map)).toEqual(['root', 'list', 'list.0', 'list.1']);
  expect(context.RootBlocks.map['list.0']).toBe(L2);
  expect(context.RootBlocks.map['list.1']).toBe(L3);

  list.removeItem(1);

  expect(Object.keys(context.RootBlocks.map)).toEqual(['root', 'list', 'list.0']);
  expect(context.RootBlocks.map['list.0']).toBe(L2);

  list.removeItem(0);

  expect(Object.keys(context.RootBlocks.map)).toEqual(['root', 'list']);
});

test('moveItemUp in list updates map', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'NumberInput',
                    blockId: 'list.$',
                    meta: {
                      category: 'input',
                      valueType: 'number',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      list: [0, 1, 2, 3],
    },
  });
  const { list } = context.RootBlocks.map;

  const L0 = context.RootBlocks.map['list.0'];
  const L1 = context.RootBlocks.map['list.1'];
  const L2 = context.RootBlocks.map['list.2'];
  const L3 = context.RootBlocks.map['list.3'];
  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);

  list.moveItemUp(1);

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);
  expect(context.RootBlocks.map['list.0']).toBe(L1);
  expect(context.RootBlocks.map['list.1']).toBe(L0);
  expect(context.RootBlocks.map['list.2']).toBe(L2);
  expect(context.RootBlocks.map['list.3']).toBe(L3);

  list.moveItemUp(0);

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);
  expect(context.RootBlocks.map['list.0']).toBe(L1);
  expect(context.RootBlocks.map['list.1']).toBe(L0);
  expect(context.RootBlocks.map['list.2']).toBe(L2);
  expect(context.RootBlocks.map['list.3']).toBe(L3);
});

test('moveItemDown in list updates map', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'NumberInput',
                    blockId: 'list.$',
                    meta: {
                      category: 'input',
                      valueType: 'number',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      list: [0, 1, 2, 3],
    },
  });
  const { list } = context.RootBlocks.map;

  const L0 = context.RootBlocks.map['list.0'];
  const L1 = context.RootBlocks.map['list.1'];
  const L2 = context.RootBlocks.map['list.2'];
  const L3 = context.RootBlocks.map['list.3'];

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);
  list.moveItemDown(1);

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);
  expect(context.RootBlocks.map['list.0']).toBe(L0);
  expect(context.RootBlocks.map['list.1']).toBe(L2);
  expect(context.RootBlocks.map['list.2']).toBe(L1);
  expect(context.RootBlocks.map['list.3']).toBe(L3);

  list.moveItemDown(3);

  expect(Object.keys(context.RootBlocks.map)).toEqual([
    'root',
    'list',
    'list.0',
    'list.1',
    'list.2',
    'list.3',
  ]);
  expect(context.RootBlocks.map['list.0']).toBe(L0);
  expect(context.RootBlocks.map['list.1']).toBe(L2);
  expect(context.RootBlocks.map['list.2']).toBe(L1);
  expect(context.RootBlocks.map['list.3']).toBe(L3);
});
