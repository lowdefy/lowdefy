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

import getPageConfig from './getPageConfig.js';
import testContext from '../../test/testContext.js';

const mockReadConfigFile = jest.fn();

const context = testContext({ readConfigFile: mockReadConfigFile });
const authenticatedContext = testContext({
  readConfigFile: mockReadConfigFile,
  user: { sub: 'sub', roles: [] },
});

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getPageConfig, public', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') {
      return {
        id: 'page:pageId',
        auth: {
          public: true,
        },
      };
    }
    return null;
  });
  const res = await getPageConfig(context, { pageId: 'pageId' });
  expect(res).toEqual({
    status: 'ok',
    pageConfig: {
      id: 'page:pageId',
    },
  });
});

test('getPageConfig, protected, no user, returns unauthenticated', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') {
      return {
        id: 'page:pageId',
        auth: {
          public: false,
        },
      };
    }
    return null;
  });
  const res = await getPageConfig(context, { pageId: 'pageId' });
  expect(res).toEqual({ status: 'unauthenticated' });
});

test('getPageConfig, protected, with authorized user', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') {
      return {
        id: 'page:pageId',
        auth: {
          public: false,
        },
      };
    }
    return null;
  });

  const res = await getPageConfig(authenticatedContext, { pageId: 'pageId' });
  expect(res).toEqual({
    status: 'ok',
    pageConfig: {
      id: 'page:pageId',
    },
  });
});

test('getPageConfig, protected by role, with user but wrong role, returns unauthorized', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') {
      return {
        id: 'page:pageId',
        auth: {
          public: false,
          roles: ['admin'],
        },
      };
    }
    return null;
  });

  const res = await getPageConfig(authenticatedContext, { pageId: 'pageId' });
  expect(res).toEqual({ status: 'unauthorized' });
});

test('getPageConfig, page does not exist', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') {
      return {
        id: 'page:pageId',
        auth: {
          public: true,
        },
      };
    }
    return null;
  });
  const res = await getPageConfig(context, { pageId: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, dynamic page resolves Dynamic blocks and does not mutate the cached config', async () => {
  const cachedPageConfig = {
    id: 'page:pageId',
    pageId: 'pageId',
    blockId: 'pageId',
    type: 'Box',
    dynamic: true,
    auth: { public: true },
    requests: [],
    slots: {
      content: {
        blocks: [
          {
            id: 'block:pageId:section_1:0',
            blockId: 'section_1',
            type: 'Dynamic',
            properties: { endpointId: 'resolve_section' },
          },
        ],
      },
    },
  };
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') return cachedPageConfig;
    if (path === 'types.json') {
      return {
        actions: {},
        blocks: { Box: {}, Dynamic: {}, Html: {} },
        operators: { client: {}, server: {} },
      };
    }
    if (path === 'plugins/blockMetas.json') return {};
    if (path === 'plugins/blockSchemas.json') return {};
    if (path === 'api/resolve_section.json') {
      return {
        endpointId: 'resolve_section',
        type: 'InternalApi',
        auth: { public: true },
        routine: {
          ':return': {
            blocks: [{ id: 'generated', type: 'Html', properties: { html: 'resolved' } }],
          },
        },
      };
    }
    return null;
  });
  const res = await getPageConfig(context, { pageId: 'pageId', urlQuery: {} });
  const dynamicBlock = res.slots.content.blocks[0];
  expect(dynamicBlock.slots.content.blocks[0].properties.html).toBe('resolved');
  expect(dynamicBlock.properties.endpointId).toBe(undefined);
  // The fileCache-cached config object is untouched by resolution.
  const cachedDynamicBlock = cachedPageConfig.slots.content.blocks[0];
  expect(cachedDynamicBlock.properties.endpointId).toBe('resolve_section');
  expect(cachedDynamicBlock.slots).toBe(undefined);
});
