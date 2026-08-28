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

test('getPageConfig, missing page, authenticated user, pagesProtectedByDefault true, returns not_found', async () => {
  mockReadConfigFile.mockImplementation(() => null);
  const protectedContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: true },
    user: { sub: 'sub', roles: [] },
  });
  const res = await getPageConfig(protectedContext, { pageId: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, missing page, no user, pagesProtectedByDefault false, returns not_found', async () => {
  mockReadConfigFile.mockImplementation(() => null);
  const openContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: false },
  });
  const res = await getPageConfig(openContext, { pageId: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, missing page, no user, authEnforcement null, returns not_found', async () => {
  mockReadConfigFile.mockImplementation(() => null);
  const res = await getPageConfig(context, { pageId: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, missing page, no user, authEnforcement has no pagesProtectedByDefault key, returns not_found', async () => {
  mockReadConfigFile.mockImplementation(() => null);
  const noKeyContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: {},
  });
  const res = await getPageConfig(noKeyContext, { pageId: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, missing page, no user, pagesProtectedByDefault true, returns unauthenticated', async () => {
  mockReadConfigFile.mockImplementation(() => null);
  const protectedContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: true },
  });
  const res = await getPageConfig(protectedContext, { pageId: 'doesNotExist' });
  expect(res).toEqual({ status: 'unauthenticated' });
});

test('getPageConfig, existing page, enrol_required, returns enrol_required with no pageConfig', async () => {
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
  const enrolContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { twoFactorRequired: true, twoFactorEnrolPageId: 'enrol' },
    user: { sub: 'sub', roles: [], two_factor_enrolled: false },
  });
  const res = await getPageConfig(enrolContext, { pageId: 'pageId' });
  expect(res).toEqual({ status: 'enrol_required' });
  expect(res.pageConfig).toBe(undefined);
});

test('getPageConfig, gate is called with pageConfig and { pageId }', async () => {
  const pageConfig = {
    id: 'page:pageId',
    auth: {
      public: true,
    },
  };
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'pages/pageId.json') return pageConfig;
    return null;
  });
  const spiedContext = testContext({ readConfigFile: mockReadConfigFile });
  spiedContext.authorizeOutcome = jest.fn(() => 'allow');
  await getPageConfig(spiedContext, { pageId: 'pageId' });
  expect(spiedContext.authorizeOutcome).toHaveBeenCalledWith(pageConfig, { pageId: 'pageId' });
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
  expect(res.status).toBe('ok');
  const dynamicBlock = res.pageConfig.slots.content.blocks[0];
  expect(dynamicBlock.slots.content.blocks[0].properties.html).toBe('resolved');
  expect(dynamicBlock.properties.endpointId).toBe(undefined);
  // The fileCache-cached config object is untouched by resolution.
  const cachedDynamicBlock = cachedPageConfig.slots.content.blocks[0];
  expect(cachedDynamicBlock.properties.endpointId).toBe('resolve_section');
  expect(cachedDynamicBlock.slots).toBe(undefined);
});
