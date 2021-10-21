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

test('set empty operators array if no operators on page', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Container',
          },
          {
            id: 'block_2',
            type: 'Container',
            blocks: [
              {
                id: 'block_3',
                type: 'Display',
              },
            ],
          },
          {
            id: 'block_4',
            type: 'Display',
          },
        ],
      },
      {
        id: 'block_5',
        type: 'Display',
        auth,
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(get(res, 'pages.0.operators')).toEqual([]);
});

test('set all operators for the page', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        properties: {
          a: { _op_1: {} },
        },
        blocks: [
          {
            id: 'block_1',
            type: 'Display',
            visible: {
              __op_2: {},
            },
            properties: {
              a: { _op_1: {} },
              b: { _op_1: {} },
              c: { _op_3: { __op_4: { ___op_5: {} } } },
            },
          },
        ],
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(new Set(get(res, 'pages.0.operators'))).toEqual(
    new Set(['_op_1', '_op_2', '_op_3', '_op_4', '_op_5'])
  );
});

test('exclude requests operators', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        requests: [
          {
            id: 'request_1',
            properties: {
              a: { _r_op_1: {} },
            },
          },
        ],
        properties: {
          a: { _op_1: {} },
        },
        blocks: [
          {
            id: 'block_1',
            type: 'Display',
            visible: {
              _op_2: {},
            },
            properties: {
              a: { _op_3: {} },
            },
          },
        ],
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(new Set(get(res, 'pages.0.operators'))).toEqual(new Set(['_op_1', '_op_2', '_op_3']));
});

test('include request payload operators', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        requests: [
          {
            id: 'request_1',
            payload: {
              a: { _r_op_1: {} },
            },
            properties: {
              a: { _r_op_2: {} },
            },
          },
        ],
        properties: {
          a: { _op_1: {} },
        },
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(new Set(get(res, 'pages.0.operators'))).toEqual(new Set(['_op_1', '_r_op_1']));
});
