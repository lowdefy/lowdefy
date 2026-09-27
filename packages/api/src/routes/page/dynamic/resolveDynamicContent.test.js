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

// A plugin operator can return a class instance whose toJSON differs from its own keys.
class Hider {
  constructor() {
    this.x = { _request: 'secret' };
  }

  toJSON() {
    return { safe: true };
  }
}

const operators = { ...operatorsServer, _hider: () => new Hider() };

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

// Every client operator name the app knows (installed, bundled or not).
const clientOperators = ['_args', '_global', '_if', '_not', '_request', '_state', '_type', '_user'];

function baseFiles(endpointConfigs = {}) {
  const files = {
    'types.json': types,
    'plugins/blockMetas.json': {},
    'plugins/blockSchemas.json': {},
    'plugins/clientOperators.json': clientOperators,
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
  // The reject logged its own warning; the fallback does not log it again.
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.error).not.toHaveBeenCalled();
});

test('resolveDynamicContent logs a payload its endpoint refuses once, as a warning', async () => {
  const dynamicBlock = await resolveWithRoutine(
    { ':return': { blocks: [] } },
    {
      payloadSchema: {
        type: 'object',
        properties: { params: { type: 'object', properties: { area: { type: 'number' } } } },
      },
    }
  );
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(logger.error).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0].event).toBe('dynamic_block_error');
  expect(logger.warn.mock.calls[0][1]).toContain('at /params/area: must be number.');
});

test('resolveDynamicContent logs a nested CallApi payload its target refuses once, as a warning', async () => {
  const dynamicBlock = await resolveWithRoutine(
    [
      {
        id: 'endpoint:resolve_section:inner',
        stepId: 'inner',
        type: 'CallApi',
        properties: { endpointId: 'inner_api', payload: { quantity: 'two' } },
      },
      { ':return': { blocks: [] } },
    ],
    {
      extraEndpoints: {
        inner_api: {
          payloadSchema: { type: 'object', properties: { quantity: { type: 'number' } } },
          routine: { ':return': { ok: true } },
        },
      },
    }
  );
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(logger.error).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][1]).toContain(
    'Payload for endpoint "inner_api" does not match its payloadSchema at /quantity'
  );
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

function dynamicBlockError() {
  const call = logger.error.mock.calls.find(([entry]) => entry?.event === 'dynamic_block_error');
  return call?.[1];
}

function resolveWithRoutine(routine, { urlQuery = {}, extraEndpoints = {}, payloadSchema } = {}) {
  const dynamicBlock = makeDynamicBlock({
    fallbackBlocks: [{ id: 'fb', blockId: 'fb', type: 'Html', properties: { html: 'fallback' } }],
  });
  const pageConfig = makePageConfig(dynamicBlock);
  const context = createTestContext({
    files: baseFiles({ resolve_section: { routine, payloadSchema }, ...extraEndpoints }),
  });
  return resolveDynamicContent(context, { pageConfig, urlQuery }).then(() => dynamicBlock);
}

test('resolveDynamicContent falls back when routine state data carries an operator', async () => {
  const dynamicBlock = await resolveWithRoutine([
    {
      ':set_state': {
        stored: [{ id: 'field', type: 'Html', properties: { html: { _request: 'secret' } } }],
      },
    },
    { ':return': { blocks: { _state: 'stored' } } },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_state" contains the operator "_request" at "0.properties.html".'
  );
});

test('resolveDynamicContent falls back when payload data carries an escaped operator', async () => {
  const dynamicBlock = await resolveWithRoutine(
    {
      ':return': {
        blocks: [
          { id: 'field', type: 'Html', properties: { html: { _payload: 'urlQuery.html' } } },
        ],
      },
    },
    { urlQuery: { html: { __request: 'secret' } } }
  );
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_payload" contains the operator "_request".'
  );
});

test('resolveDynamicContent falls back when a nested endpoint returns data carrying an operator', async () => {
  const dynamicBlock = await resolveWithRoutine(
    [
      {
        id: 'endpoint:resolve_section:inner',
        stepId: 'inner',
        type: 'CallApi',
        properties: { endpointId: 'inner_api' },
      },
      { ':return': { blocks: { _step: 'inner.blocks' } } },
    ],
    {
      extraEndpoints: {
        inner_api: {
          routine: {
            ':return': {
              blocks: [{ id: 'field', type: 'Html', properties: { html: { _request: 'x' } } }],
            },
          },
        },
      },
    }
  );
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_step" contains the operator "_request" at "0.properties.html".'
  );
});

test('resolveDynamicContent maps data rows into blocks the documented way', async () => {
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { rows: [{ section_id: 'a', title: 'Alpha' }] } },
    {
      ':return': {
        blocks: {
          '_array.map': {
            on: { _state: 'rows' },
            callback: {
              _function: {
                '__object.assign': [
                  {
                    id: { __args: '0.section_id' },
                    type: 'Html',
                    properties: { title: { __args: '0.title' } },
                  },
                ],
              },
            },
          },
        },
      },
    },
  ]);
  const generated = dynamicBlock.slots.content.blocks[0];
  expect(generated.blockId).toBe('a');
  expect(generated.properties).toEqual({ title: 'Alpha' });
  expect(dynamicBlockError()).toBe(undefined);
});

test('resolveDynamicContent falls back when a mapped data row carries an operator', async () => {
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { rows: [{ section_id: 'a', title: { _global: 'token' } }] } },
    {
      ':return': {
        blocks: {
          '_array.map': {
            on: { _state: 'rows' },
            callback: {
              _function: {
                '__object.assign': [
                  {
                    id: { __args: '0.section_id' },
                    type: 'Html',
                    properties: { html: { __args: '0.title' } },
                  },
                ],
              },
            },
          },
        },
      },
    },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_state" contains the operator "_global" at "0.title".'
  );
});

test('resolveDynamicContent leaves double-underscore keys in data objects unchanged', async () => {
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { record: { __typename: 'Product', name: 'Chair' } } },
    {
      ':return': {
        blocks: [{ id: 'field', type: 'Html', properties: { record: { _state: 'record' } } }],
      },
    },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].properties.record).toEqual({
    __typename: 'Product',
    name: 'Chair',
  });
});

test('resolveDynamicContent falls back when parsed data text carries an operator', async () => {
  const dynamicBlock = await resolveWithRoutine([
    {
      ':set_state': {
        stored: '[{"id":"field","type":"Html","properties":{"html":{"_request":"x"}}}]',
      },
    },
    { ':return': { blocks: { '_json.parse': { _state: 'stored' } } } },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_json.parse" contains the operator "_request" at "0.properties.html".'
  );
});

test('resolveDynamicContent falls back when a __proto__ key in parsed data text hides an operator', async () => {
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { stored: '{"_request":"secret","__proto__":{}}' } },
    {
      ':return': {
        blocks: [
          {
            id: 'field',
            type: 'Html',
            properties: { html: { '_json.parse': { _state: 'stored' } } },
          },
        ],
      },
    },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_json.parse" contains the operator "_request".'
  );
});

// Serializer wrappers: the server revives { "~e": ... } as an Error, which the page
// writes back as "~e" and the client revives only after evaluating what is inside.
test.each([
  ['an error message', { '~e': { name: 'Error', message: { _request: 'secret' } } }],
  ['an error cause', { '~e': { name: 'Error', message: 'x', cause: { _request: 'secret' } } }],
  [
    'an error inside an error',
    { '~e': { name: 'Error', message: { '~e': { name: 'Error', message: { _request: 's' } } } } },
  ],
  ['an error in a list', [{ '~e': { name: 'Error', message: { _request: 'secret' } } }]],
  ['a date wrapper', { '~d': { _request: 'secret' } }],
  ['an array wrapper', { '~arr': [{ _request: 'secret' }] }],
])(
  'resolveDynamicContent falls back when payload data hides an operator in %s',
  async (_, html) => {
    const dynamicBlock = await resolveWithRoutine(
      {
        ':return': {
          blocks: [
            { id: 'field', type: 'Html', properties: { html: { _payload: 'urlQuery.html' } } },
          ],
        },
      },
      { urlQuery: { html } }
    );
    expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
    expect(dynamicBlockError()).toContain(
      'Data returned by "_payload" contains the operator "_request"'
    );
  }
);

test('resolveDynamicContent falls back when parsed data text hides an operator in an error', async () => {
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { stored: '{"~e":{"name":"Error","message":{"_request":"secret"}}}' } },
    {
      ':return': {
        blocks: [
          {
            id: 'field',
            type: 'Html',
            properties: { html: { '_json.parse': { _state: 'stored' } } },
          },
        ],
      },
    },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain(
    'Data returned by "_json.parse" contains the operator "_request"'
  );
});

test('resolveDynamicContent sends the form of operator data it checked, not a class instance', async () => {
  const dynamicBlock = await resolveWithRoutine({
    ':return': { blocks: [{ id: 'field', type: 'Html', properties: { html: { _hider: true } } }] },
  });
  const { properties } = dynamicBlock.slots.content.blocks[0];
  expect(properties.html).toEqual({ safe: true });
  expect(JSON.stringify(properties)).not.toContain('_request');
});

test('resolveDynamicContent rejects blocks built up in routine state', async () => {
  const dynamicBlock = await resolveWithRoutine([
    {
      ':set_state': {
        built: [{ id: 'field', type: 'Html', properties: { html: { ___state: 'answer' } } }],
      },
    },
    { ':return': { blocks: { _state: 'built' } } },
  ]);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockError()).toContain('Data returned by "_state"');
});

function dynamicBlockErrorMessage() {
  return dynamicBlockError() ?? '';
}

const storedBlocks = [
  {
    id: 'stored',
    type: 'Html',
    properties: { html: 'Stored' },
    events: { onClick: [{ id: 'go', type: 'Request', params: 'load' }] },
  },
];

// Without a policy, data an operator returns fills values inside the blocks the
// :return writes, but it is never a block or an action itself.
test.each([
  [
    'returned by a nested endpoint',
    [
      {
        id: 'endpoint:resolve_section:inner',
        stepId: 'inner',
        type: 'CallApi',
        properties: { endpointId: 'inner_api' },
      },
      { ':return': { blocks: { _step: 'inner.blocks' } } },
    ],
    'Block at "blocks.0" is data returned by "_step"',
  ],
  [
    'built up in routine state',
    [{ ':set_state': { built: storedBlocks } }, { ':return': { blocks: { _state: 'built' } } }],
    'Block at "blocks.0" is data returned by "_state"',
  ],
  [
    'read with _get from data',
    [
      { ':set_state': { page: { blocks: storedBlocks } } },
      { ':return': { blocks: { _get: { from: { _state: 'page' }, key: 'blocks' } } } },
    ],
    'Block at "blocks.0" is data returned by "_state"',
  ],
  [
    'copied whole by a mapping function',
    [
      { ':set_state': { built: storedBlocks } },
      {
        ':return': {
          blocks: {
            '_array.map': { on: { _state: 'built' }, callback: { _function: { __args: 0 } } },
          },
        },
      },
    ],
    'Block at "blocks.0" is data returned by "_state"',
  ],
  [
    'merged into config by a mapping function',
    [
      { ':set_state': { built: storedBlocks } },
      {
        ':return': {
          blocks: {
            '_array.map': {
              on: { _state: 'built' },
              callback: {
                _function: { '__object.assign': [{}, { __args: 0 }, { layout: { span: 12 } }] },
              },
            },
          },
        },
      },
    ],
    'Block at "blocks.0" is data returned by "_state"',
  ],
  [
    'nested in a written block',
    [
      { ':set_state': { built: storedBlocks } },
      { ':return': { blocks: [{ id: 'wrapper', type: 'Box', blocks: { _state: 'built' } }] } },
    ],
    'Block at "blocks.0.blocks.0" is data returned by "_state"',
  ],
  [
    'an action list read into a written block',
    [
      { ':set_state': { actions: [{ id: 'go', type: 'Request', params: 'load' }] } },
      {
        ':return': {
          blocks: [{ id: 'button', type: 'Box', events: { onClick: { _state: 'actions' } } }],
        },
      },
    ],
    'Action at "blocks.0.events.onClick.0" is data returned by "_state"',
  ],
])(
  'resolveDynamicContent falls back when a block or action is data %s',
  async (_, routine, message) => {
    const dynamicBlock = await resolveWithRoutine(routine, {
      extraEndpoints: { inner_api: { routine: { ':return': { blocks: storedBlocks } } } },
    });
    expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
    expect(dynamicBlockErrorMessage()).toContain(message);
  }
);

test('resolveDynamicContent maps data rows that carry a type into written blocks', async () => {
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { rows: [{ id: 'name', type: 'Html', label: 'Name' }] } },
    {
      ':return': {
        blocks: {
          '_array.map': {
            on: { _state: 'rows' },
            callback: {
              _function: {
                id: { __args: '0.id' },
                type: { __args: '0.type' },
                properties: { html: { __args: '0.label' } },
              },
            },
          },
        },
      },
    },
  ]);
  expect(dynamicBlockError()).toBe(undefined);
  expect(dynamicBlock.slots.content.blocks[0].properties.html).toBe('Name');
});

test('resolveDynamicContent keeps written block config chosen from a literal map', async () => {
  const dynamicBlock = await resolveWithRoutine({
    ':return': {
      blocks: {
        _get: {
          from: { admin: [{ id: 'admin_panel', type: 'Html', properties: { html: 'Admin' } }] },
          key: 'admin',
        },
      },
    },
  });
  expect(dynamicBlockError()).toBe(undefined);
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('admin_panel');
});

// The client runs an object as an operator once its other keys evaluate to
// undefined, so data merged next to such a key must not be left holding one.
test.each([
  ['a key the client evaluates to undefined', { note: { __if: { test: false, then: 1 } } }],
  ['a function the server never sends', { note: { _function: { x: 1 } } }],
])(
  'resolveDynamicContent falls back when data merged with %s can run as an operator',
  async (_, merged) => {
    const dynamicBlock = await resolveWithRoutine(
      {
        ':return': {
          blocks: [
            {
              id: 'field',
              type: 'Html',
              properties: {
                html: { '_object.assign': [{ _payload: 'urlQuery.row' }, merged] },
              },
            },
          ],
        },
      },
      { urlQuery: { row: { _user: 'email', note: 'x' } } }
    );
    expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
    expect(dynamicBlockErrorMessage()).toContain(
      'Data returned by "_payload" can run as the operator "_user" at "blocks.0.properties.html"'
    );
  }
);

test('resolveDynamicContent keeps data keys that name no client operator as data', async () => {
  const hit = { _score: 0.5 };
  const source = { _source: { title: 'Chair' } };
  const dynamicBlock = await resolveWithRoutine([
    { ':set_state': { hit, source, typename: { __typename: 'Product' } } },
    {
      ':return': {
        blocks: [
          {
            id: 'field',
            type: 'Html',
            properties: {
              hit: { _state: 'hit' },
              source: { _state: 'source' },
              typename: { _state: 'typename' },
            },
          },
        ],
      },
    },
  ]);
  expect(dynamicBlockError()).toBe(undefined);
  expect(dynamicBlock.slots.content.blocks[0].properties).toEqual({
    hit,
    source,
    typename: { __typename: 'Product' },
  });
});

test('resolveDynamicContent falls back when data used as a _function body names a server operator', async () => {
  const dynamicBlock = await resolveWithRoutine(
    {
      ':return': {
        blocks: [
          {
            id: 'field',
            type: 'Html',
            properties: {
              html: {
                '_array.map': { on: [1], callback: { _function: { _payload: 'urlQuery.body' } } },
              },
            },
          },
        ],
      },
    },
    { urlQuery: { body: { value: { __payload: 'blockId' } } } }
  );
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
  expect(dynamicBlockErrorMessage()).toContain(
    'Data returned by "_payload" contains the operator "_payload" at "value".'
  );
});
