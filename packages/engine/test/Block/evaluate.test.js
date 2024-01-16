/* eslint-disable dot-notation */

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

test('parse block visible', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        visible: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.visible).toEqual({ _state: 'key' });
  expect(textInput.eval.visible).toEqual('value');
});

test('default value for visible', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.visible).toEqual(true);
  expect(textInput.eval.visible).toEqual(true);
});

test('parse block required', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        required: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.required).toEqual({ _state: 'key' });
  expect(textInput.eval.required).toEqual('value');
});

test('default value for required', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.required).toEqual(false);
  expect(textInput.eval.required).toEqual(false);
});

test('parse block properties', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        properties: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.properties).toEqual({ _state: 'key' });
  expect(textInput.eval.properties).toEqual('value');
});

test('default value for properties', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.properties).toEqual({});
  expect(textInput.eval.properties).toEqual({});
});

test('parse block style', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        style: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.style).toEqual({ _state: 'key' });
  expect(textInput.eval.style).toEqual('value');
});

test('default value for style', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.style).toEqual({});
  expect(textInput.eval.style).toEqual({});
});

test('parse block layout', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        layout: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.layout).toEqual({ _state: 'key' });
  expect(textInput.eval.layout).toEqual('value');
});

test('default value for layout', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.layout).toEqual({});
  expect(textInput.eval.layout).toEqual({});
});

test('parse block areas', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        areas: {
          area1: {
            property1: { _state: 'key' },
          },
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.eval.areas).toEqual({
    area1: {
      property1: 'value',
    },
  });
});

test('parse block areas, remove blocks array', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        areas: {
          area1: {
            property1: { _state: 'key' },
            blocks: [
              {
                type: 'TextInput',
                id: 'textInput2',
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
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.eval.areas).toEqual({
    area1: {
      property1: 'value',
    },
  });
});

test('default value for areas', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.eval.areas).toEqual({});
});

test('parse block loading', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: true },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        loading: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.loading).toEqual({ _state: 'key' });
  expect(textInput.eval.loading).toEqual(true);
});

test('default value for loading', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.loading).toEqual(false);
  expect(textInput.eval.loading).toEqual(false);
});

test('parse block skeleton', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { key: false },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
        skeleton: { _state: 'key' },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.skeleton).toEqual({ _state: 'key' });
  expect(textInput.eval.skeleton).toEqual(false);
});

test('default value for skeleton', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'ini',
          type: 'SetState',
          params: { key: 'value' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.skeleton).toEqual(null);
  expect(textInput.eval.skeleton).toEqual(null);
});
