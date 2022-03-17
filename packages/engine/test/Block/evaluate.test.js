/* eslint-disable dot-notation */

/*
   Copyright 2020-2022 Lowdefy, Inc

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

test('parse block visible', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            visible: { _state: 'key' },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.visible).toEqual({ _state: 'key' });
  expect(textInput.eval.visible).toEqual('value');
});

test('default value for visible', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.visible).toEqual(true);
  expect(textInput.eval.visible).toEqual(true);
});

test('parse block required', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            required: { _state: 'key' },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.required).toEqual({ _state: 'key' });
  expect(textInput.eval.required).toEqual('value');
});

test('default value for required', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.required).toEqual(false);
  expect(textInput.eval.required).toEqual(false);
});

test('parse block properties', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            properties: { _state: 'key' },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.properties).toEqual({ _state: 'key' });
  expect(textInput.eval.properties).toEqual('value');
});

test('default value for properties', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.properties).toEqual({});
  expect(textInput.eval.properties).toEqual({});
});

test('parse block style', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            style: { _state: 'key' },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.style).toEqual({ _state: 'key' });
  expect(textInput.eval.style).toEqual('value');
});

test('default value for style', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.style).toEqual({});
  expect(textInput.eval.style).toEqual({});
});

test('parse block layout', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            layout: { _state: 'key' },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.layout).toEqual({ _state: 'key' });
  expect(textInput.eval.layout).toEqual('value');
});

test('default value for layout', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.layout).toEqual({});
  expect(textInput.eval.layout).toEqual({});
});

test('parse block areas', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            areas: {
              area1: {
                property1: { _state: 'key' },
              },
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.eval.areas).toEqual({
    area1: {
      property1: 'value',
    },
  });
});

test('parse block areas, remove blocks array', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            areas: {
              area1: {
                property1: { _state: 'key' },
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'textInput2',
                    meta: {
                      category: 'input',
                      valueType: 'string',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.eval.areas).toEqual({
    area1: {
      property1: 'value',
    },
  });
});

test('default value for areas', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { key: 'value' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.eval.areas).toEqual({});
});
