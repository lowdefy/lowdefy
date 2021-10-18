/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { get } from '@lowdefy/helpers';
import buildPages from '../buildPages';
import testContext from '../../../test/testContext';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const blockMetas = {
  Container: {
    category: 'container',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Container',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  List: {
    category: 'list',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'List',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  Input: {
    category: 'input',
    valueType: 'string',
    loading: {
      type: 'SkeletonInput',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Input',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  Display: {
    category: 'display',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Display',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
};

const outputMetas = {
  Container: {
    category: 'container',
    moduleFederation: {
      scope: 'blocks',
      module: 'Container',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
  },
  List: {
    category: 'list',
    moduleFederation: {
      scope: 'blocks',
      module: 'List',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
    valueType: 'array',
  },
  Input: {
    category: 'input',
    moduleFederation: {
      scope: 'blocks',
      module: 'Input',
      url: 'https://example.com/remoteEntry.js',
    },
    valueType: 'string',
    loading: {
      type: 'SkeletonInput',
    },
  },
  Display: {
    category: 'display',
    moduleFederation: {
      scope: 'blocks',
      module: 'Display',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
  },
};

const auth = {
  public: true,
};

const getMeta = (type) => {
  const meta = blockMetas[type];
  if (!meta) {
    return null;
  }
  return Promise.resolve(meta);
};

const context = testContext({ logger, getMeta });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('block events actions array should map to try catch', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: [
                {
                  id: 'action_1',
                  type: 'Reset',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([]);
});

test('block events actions as try catch arrays', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_2',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([
    {
      id: 'action_2',
      type: 'Retry',
    },
  ]);
});

test('block events actions try not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: {
                  id: 'action_1',
                  type: 'Reset',
                },
              },
            },
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Events must be an array of actions at "block_1" in event "onClick" on page "page_1". Received {"id":"action_1","type":"Reset"}'
  );
});

test('block events actions not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {},
            },
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Events must be an array of actions at "block_1" in event "onClick" on page "page_1". Received undefined'
  );
});

test('block events actions catch not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [],
                catch: {
                  id: 'action_1',
                  type: 'Reset',
                },
              },
            },
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Catch events must be an array of actions at "block_1" in event "onClick" on page "page_1". Received {"id":"action_1","type":"Reset"}'
  );
});

test('block events action id is not defined', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: undefined,
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_1',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Action id missing on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('block events action id is not a string', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: true,
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_1',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Action id is not a string on event "onClick" on block "block_1" on page "page_1". Received true.'
  );
});

test('throw on Duplicate block events action ids', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_2',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Duplicate actionId "action_1" on event "onClick" on block "block_1" on page "page_1".'
  );
});
