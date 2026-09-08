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

import buildDynamicBlocks from './buildDynamicBlocks.js';

const types = {
  actions: {
    Request: {},
    SetState: {},
  },
  blocks: {
    Box: {},
    Dynamic: {},
    Html: {},
    TextInput: {},
  },
  operators: {
    client: {
      _not: {},
      _state: {},
      _type: {},
    },
    server: {},
  },
};

const defaultArgs = {
  pageId: 'page1',
  dynamicBlockId: 'section_1',
  idPrefix: 'block:page1:section_1:0',
  types,
  blockMetas: {},
};

test('buildDynamicBlocks builds blocks with namespaced ids and moved slots', () => {
  const blocks = [
    {
      id: 'wrapper',
      type: 'Box',
      blocks: [
        { id: 'inner', type: 'Html', properties: { html: 'hello' } },
        { id: 'inner', type: 'Html', properties: { html: 'again' } },
      ],
    },
  ];
  const result = buildDynamicBlocks({ ...defaultArgs, blocks });
  const wrapper = result.blocks[0];
  expect(wrapper.blockId).toBe('wrapper');
  expect(wrapper.id).toBe('block:page1:section_1:0:wrapper:0');
  expect(wrapper.blocks).toBe(undefined);
  const inner = wrapper.slots.content.blocks;
  expect(inner[0].id).toBe('block:page1:section_1:0:inner:0');
  expect(inner[1].id).toBe('block:page1:section_1:0:inner:1');
});

test('buildDynamicBlocks builds events and collects Request and CallAPI action refs', () => {
  const blocks = [
    {
      id: 'button_like',
      type: 'Box',
      events: {
        onClick: [
          { id: 'fetch', type: 'Request', params: 'get_data' },
          { id: 'call', type: 'CallAPI', params: { endpointId: 'my_endpoint' } },
        ],
      },
    },
  ];
  const result = buildDynamicBlocks({
    ...defaultArgs,
    types: {
      ...types,
      actions: { Request: {}, CallAPI: {} },
    },
    blocks,
  });
  expect(result.blocks[0].events.onClick).toEqual({
    try: [
      { id: 'fetch', type: 'Request', params: 'get_data' },
      { id: 'call', type: 'CallAPI', params: { endpointId: 'my_endpoint' } },
    ],
    catch: [],
  });
  expect(result.requestActionRefs).toMatchObject([{ requestId: 'get_data' }]);
  expect(result.callApiActionRefs).toMatchObject([
    { endpointId: 'my_endpoint', sourcePageId: 'page1' },
  ]);
});

test('buildDynamicBlocks throws when a block defines requests', () => {
  const blocks = [
    {
      id: 'wrapper',
      type: 'Box',
      requests: [{ id: 'runtime_request', type: 'MongoDBFind' }],
    },
  ];
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks })).toThrow(
    'Dynamic content must not define requests — found "requests" on block "wrapper" on page "page1". Reference requests defined statically on the page instead.'
  );
});

test('buildDynamicBlocks throws when a block type is not in the client bundle', () => {
  const blocks = [{ id: 'grid', type: 'AgGridAlpine' }];
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks })).toThrow(
    'Dynamic block "section_1" on page "page1" resolved content uses block type "AgGridAlpine" which is not included in the app\'s client bundle. Declare it in the Dynamic block\'s properties.types.'
  );
});

test('buildDynamicBlocks throws when an action type is not in the client bundle', () => {
  const blocks = [
    {
      id: 'wrapper',
      type: 'Box',
      events: {
        onClick: [{ id: 'copy', type: 'CopyToClipboard', params: {} }],
      },
    },
  ];
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks })).toThrow(
    'Dynamic block "section_1" on page "page1" resolved content uses action type "CopyToClipboard" which is not included in the app\'s client bundle.'
  );
});

test('buildDynamicBlocks throws when a client operator is not in the client bundle', () => {
  const blocks = [
    {
      id: 'wrapper',
      type: 'Html',
      properties: {
        html: { _number: { round: 1.5 } },
      },
    },
  ];
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks })).toThrow(
    'Dynamic block "section_1" on page "page1" resolved content uses operator type "_number" which is not included in the app\'s client bundle.'
  );
});

test('buildDynamicBlocks allows bundled client operators', () => {
  const blocks = [
    {
      id: 'wrapper',
      type: 'Html',
      properties: {
        html: { _state: 'message' },
      },
    },
  ];
  const result = buildDynamicBlocks({ ...defaultArgs, blocks });
  expect(result.blocks[0].properties.html).toEqual({ _state: 'message' });
});

test('buildDynamicBlocks allows nested Dynamic blocks and validates their config', () => {
  const blocks = [
    {
      id: 'nested',
      type: 'Dynamic',
      properties: { endpointId: 'resolve_nested' },
    },
  ];
  const result = buildDynamicBlocks({ ...defaultArgs, blocks });
  expect(result.blocks[0].type).toBe('Dynamic');
  expect(result.blocks[0].properties.endpointId).toBe('resolve_nested');
});

test('buildDynamicBlocks throws when a nested Dynamic block is missing endpointId', () => {
  const blocks = [{ id: 'nested', type: 'Dynamic', properties: {} }];
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks })).toThrow(
    'Dynamic block "nested" on page "page1" requires properties.endpointId.'
  );
});

test('buildDynamicBlocks throws when blocks is not an array', () => {
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks: { id: 'a', type: 'Box' } })).toThrow(
    'Dynamic block "section_1" on page "page1" endpoint must return an object with a "blocks" array.'
  );
});

test('buildDynamicBlocks collects warnings instead of logging', () => {
  const blocks = [
    {
      id: 'wrapper',
      type: 'Box',
      areas: {
        content: {
          blocks: [{ id: 'inner', type: 'Html' }],
        },
      },
    },
  ];
  const result = buildDynamicBlocks({ ...defaultArgs, blocks });
  expect(result.warnings.length).toBe(1);
  expect(result.warnings[0].message).toContain('"areas" is deprecated');
  expect(result.blocks[0].slots.content.blocks[0].blockId).toBe('inner');
});

test('buildDynamicBlocks throws when a block is missing a type', () => {
  const blocks = [{ id: 'wrapper' }];
  expect(() => buildDynamicBlocks({ ...defaultArgs, blocks })).toThrow(
    'Block type is not defined at "wrapper" on page "page1".'
  );
});
