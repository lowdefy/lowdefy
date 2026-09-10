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

import { jest } from '@jest/globals';
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError } from '@lowdefy/errors';

import resolveDynamicContent from './resolveDynamicContent.js';
import testContext from '../../../test/testContext.js';

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const types = {
  actions: { Request: {} },
  blocks: { Box: {}, Dynamic: {}, Html: {} },
  operators: {
    client: { _args: {}, _not: {}, _state: {}, _type: {} },
    server: {},
  },
};

function createTestContext({ files = {}, session } = {}) {
  return testContext({
    operators,
    logger,
    readConfigFile: jest.fn((path) => files[path] ?? null),
    session: session ?? { user: { id: 'user_1' } },
  });
}

function baseFiles(endpointConfigs = {}) {
  const files = {
    'types.json': types,
    'plugins/blockMetas.json': {},
    'plugins/blockSchemas.json': {},
  };
  Object.entries(endpointConfigs).forEach(([endpointId, config]) => {
    files[`api/${endpointId}.json`] = {
      endpointId,
      type: 'InternalApi',
      auth: { public: true },
      ...config,
    };
  });
  return files;
}

function makeDynamicBlock({ properties, fallbackBlocks } = {}) {
  const block = {
    id: 'block:page1:section_1:0',
    blockId: 'section_1',
    type: 'Dynamic',
    properties: properties ?? { endpointId: 'resolve_section', params: { area: 'insights' } },
  };
  if (fallbackBlocks) {
    block.slots = { fallback: { blocks: fallbackBlocks } };
  }
  return block;
}

function makePageConfig(dynamicBlock, { requests } = {}) {
  return {
    id: 'page:page1',
    pageId: 'page1',
    blockId: 'page1',
    type: 'Box',
    dynamic: true,
    requests: requests ?? [],
    slots: { content: { blocks: [dynamicBlock] } },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('resolveDynamicContent splices resolved blocks into the Dynamic block content slot', async () => {
  const dynamicBlock = makeDynamicBlock({
    fallbackBlocks: [{ id: 'fb', blockId: 'fb', type: 'Html' }],
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [
              {
                id: 'generated',
                type: 'Html',
                properties: { html: { _payload: 'params.area' } },
              },
            ],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  const content = dynamicBlock.slots.content.blocks;
  expect(content).toHaveLength(1);
  expect(content[0].blockId).toBe('generated');
  expect(content[0].id).toBe('block:page1:section_1:0:generated:0');
  // _payload evaluated server-side during :return — params reach the routine.
  expect(content[0].properties.html).toBe('insights');
  // Resolution config and fallback are stripped from the client copy.
  expect(dynamicBlock.properties.endpointId).toBe(undefined);
  expect(dynamicBlock.properties.params).toBe(undefined);
  expect(dynamicBlock.slots.fallback).toBe(undefined);
});

test('resolveDynamicContent passes pageId, blockId and urlQuery in the payload', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [
              {
                id: 'generated',
                type: 'Html',
                properties: {
                  html: { '_payload.get': { key: 'urlQuery.q' } },
                  pageId: { _payload: 'pageId' },
                  blockId: { _payload: 'blockId' },
                },
              },
            ],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: { q: 'hello' } });
  const generated = dynamicBlock.slots.content.blocks[0];
  expect(generated.properties.html).toBe('hello');
  expect(generated.properties.pageId).toBe('page1');
  expect(generated.properties.blockId).toBe('section_1');
});

test('resolveDynamicContent unescapes double-underscore operators for client evaluation', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [
              {
                id: 'generated',
                type: 'Html',
                properties: {
                  // _state is a shared operator — a plain `_state` would
                  // evaluate server-side against empty routine state. The
                  // extra underscore defers it to the client.
                  html: { __state: 'message' },
                  nested: { deep: { ___args: 'stays double' } },
                },
              },
            ],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  const generated = dynamicBlock.slots.content.blocks[0];
  expect(generated.properties.html).toEqual({ _state: 'message' });
  // Each unescape strips exactly one underscore level.
  expect(generated.properties.nested.deep).toEqual({ __args: 'stays double' });
});

test('resolveDynamicContent evaluates plain _state server-side against routine state', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: [
          { ':set_state': { greeting: 'from routine state' } },
          {
            ':return': {
              blocks: [
                {
                  id: 'generated',
                  type: 'Html',
                  properties: { html: { _state: 'greeting' } },
                },
              ],
            },
          },
        ],
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  const generated = dynamicBlock.slots.content.blocks[0];
  expect(generated.properties.html).toBe('from routine state');
});

test('resolveDynamicContent renders fallback when the endpoint does not exist', async () => {
  const dynamicBlock = makeDynamicBlock({
    fallbackBlocks: [
      { id: 'fb', blockId: 'fb', type: 'Html', properties: { html: 'unavailable' } },
    ],
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({ files: baseFiles({}) });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks).toHaveLength(1);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlock.slots.fallback).toBe(undefined);
  expect(dynamicBlock.properties.endpointId).toBe(undefined);
  expect(logger.error).toHaveBeenCalledTimes(1);
  expect(logger.error.mock.calls[0][1]).toContain(
    'Dynamic block "section_1" on page "page1" failed to resolve'
  );
});

test('resolveDynamicContent renders empty content on failure without a fallback slot', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({ files: baseFiles({}) });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks).toEqual([]);
});

test('resolveDynamicContent rethrows a typed Lowdefy error when a required Dynamic block fails', async () => {
  const dynamicBlock = makeDynamicBlock({
    properties: { endpointId: 'missing_endpoint', required: true },
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({ files: baseFiles({}) });
  await expect(resolveDynamicContent(context, { pageConfig, urlQuery: {} })).rejects.toThrow(
    ConfigError
  );
  await expect(() => resolveDynamicContent(context, { pageConfig, urlQuery: {} })).rejects.toThrow(
    'API Endpoint "missing_endpoint" does not exist.'
  );
});

test('resolveDynamicContent falls back when the endpoint returns a bad shape', async () => {
  const dynamicBlock = makeDynamicBlock({
    fallbackBlocks: [{ id: 'fb', blockId: 'fb', type: 'Html' }],
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: { ':return': { rows: [1, 2] } },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(logger.error.mock.calls[0][1]).toContain('must return an object with a "blocks" array');
});

test('resolveDynamicContent falls back when the routine rejects', async () => {
  const dynamicBlock = makeDynamicBlock({
    fallbackBlocks: [{ id: 'fb', blockId: 'fb', type: 'Html' }],
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: { ':reject': 'Not allowed.' },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('resolveDynamicContent falls back when resolved content uses an unbundled block type', async () => {
  const dynamicBlock = makeDynamicBlock({
    fallbackBlocks: [{ id: 'fb', blockId: 'fb', type: 'Html' }],
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': { blocks: [{ id: 'grid', type: 'AgGridAlpine' }] },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(logger.error.mock.calls[0][1]).toContain(
    'uses block type "AgGridAlpine" which is not included'
  );
});

test('resolveDynamicContent falls back when resolved content defines requests', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [{ id: 'wrapper', type: 'Box', requests: [{ id: 'r1', type: 'MongoDBFind' }] }],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks).toEqual([]);
  expect(logger.error.mock.calls[0][1]).toContain('must not define requests');
});

test('resolveDynamicContent falls back when a Request action references an undefined page request', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock, { requests: [{ requestId: 'get_data' }] });
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [
              {
                id: 'wrapper',
                type: 'Box',
                events: { onClick: [{ id: 'fetch', type: 'Request', params: 'other_request' }] },
              },
            ],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks).toEqual([]);
  expect(logger.error.mock.calls[0][1]).toContain('references request "other_request"');
});

test('resolveDynamicContent allows Request actions referencing page requests', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock, { requests: [{ requestId: 'get_data' }] });
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [
              {
                id: 'wrapper',
                type: 'Box',
                events: { onClick: [{ id: 'fetch', type: 'Request', params: 'get_data' }] },
              },
            ],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('wrapper');
});

test('resolveDynamicContent resolves nested Dynamic blocks recursively', async () => {
  const dynamicBlock = makeDynamicBlock();
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [
              {
                id: 'nested',
                type: 'Dynamic',
                properties: { endpointId: 'resolve_nested' },
              },
            ],
          },
        },
      },
      resolve_nested: {
        routine: {
          ':return': {
            blocks: [{ id: 'deep', type: 'Html', properties: { html: 'deep content' } }],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  const nested = dynamicBlock.slots.content.blocks[0];
  expect(nested.blockId).toBe('nested');
  expect(nested.properties.endpointId).toBe(undefined);
  const deep = nested.slots.content.blocks[0];
  expect(deep.properties.html).toBe('deep content');
  expect(deep.id).toBe('block:page1:section_1:0:nested:0:deep:0');
});

test('resolveDynamicContent stops self-referencing resolution at the depth limit', async () => {
  const dynamicBlock = makeDynamicBlock({
    properties: { endpointId: 'resolve_loop' },
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({
      resolve_loop: {
        routine: {
          ':return': {
            blocks: [{ id: 'loop', type: 'Dynamic', properties: { endpointId: 'resolve_loop' } }],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(
    logger.error.mock.calls.some(([, message]) =>
      message.includes('exceeded the maximum dynamic nesting depth of 5')
    )
  ).toBe(true);
});

test('resolveDynamicContent resolves the page root when it is a Dynamic block', async () => {
  const pageConfig = {
    id: 'page:page1',
    pageId: 'page1',
    blockId: 'page1',
    type: 'Dynamic',
    dynamic: true,
    requests: [],
    properties: { endpointId: 'resolve_section' },
  };
  const context = createTestContext({
    files: baseFiles({
      resolve_section: {
        routine: {
          ':return': {
            blocks: [{ id: 'generated', type: 'Html', properties: { html: 'whole page' } }],
          },
        },
      },
    }),
  });
  await resolveDynamicContent(context, { pageConfig, urlQuery: {} });
  expect(pageConfig.slots.content.blocks[0].properties.html).toBe('whole page');
});
