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

import getPageConfig from './getPageConfig.js';
import testContext from '../../test/testContext.js';

const mockReadConfigFile = jest.fn();

const context = testContext({ readConfigFile: mockReadConfigFile });
const authenticatedContext = testContext({
  readConfigFile: mockReadConfigFile,
  user: { sub: 'sub', roles: [] },
});

const routes = [
  { pageId: 'pageId', path: 'pageId', auth: { public: true } },
  { pageId: 'ticket', path: '{space}/tickets/{ticket_id}', auth: { public: true } },
];

// Serves routes.json with the files a test names.
function serveFiles(files) {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'routes.json') return routes;
    return files[path] ?? null;
  });
}

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getPageConfig, public', async () => {
  serveFiles({
    'pages/pageId.json': {
      id: 'page:pageId',
      auth: {
        public: true,
      },
    },
  });
  const res = await getPageConfig(context, { path: 'pageId' });
  expect(res).toEqual({
    status: 'ok',
    pageId: 'pageId',
    pathParams: {},
    pageConfig: {
      id: 'page:pageId',
    },
  });
});

test('getPageConfig, protected, no user, returns unauthenticated', async () => {
  serveFiles({
    'pages/pageId.json': {
      id: 'page:pageId',
      auth: {
        public: false,
      },
    },
  });
  const res = await getPageConfig(context, { path: 'pageId' });
  expect(res).toEqual({ status: 'unauthenticated', pageId: 'pageId', pathParams: {} });
});

test('getPageConfig, protected, with authorized user', async () => {
  serveFiles({
    'pages/pageId.json': {
      id: 'page:pageId',
      auth: {
        public: false,
      },
    },
  });

  const res = await getPageConfig(authenticatedContext, { path: 'pageId' });
  expect(res).toEqual({
    status: 'ok',
    pageId: 'pageId',
    pathParams: {},
    pageConfig: {
      id: 'page:pageId',
    },
  });
});

test('getPageConfig, protected by role, with user but wrong role, returns unauthorized', async () => {
  serveFiles({
    'pages/pageId.json': {
      id: 'page:pageId',
      auth: {
        public: false,
        roles: ['admin'],
      },
    },
  });

  const res = await getPageConfig(authenticatedContext, { path: 'pageId' });
  expect(res).toEqual({ status: 'unauthorized', pageId: 'pageId', pathParams: {} });
});

test('getPageConfig, unmatched path returns not_found', async () => {
  serveFiles({
    'pages/pageId.json': {
      id: 'page:pageId',
      auth: {
        public: true,
      },
    },
  });
  const res = await getPageConfig(context, { path: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, unmatched path, authenticated user, pagesProtectedByDefault true, returns not_found', async () => {
  serveFiles({});
  const protectedContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: true },
    user: { sub: 'sub', roles: [] },
  });
  const res = await getPageConfig(protectedContext, { path: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, unmatched path, no user, pagesProtectedByDefault false, returns not_found', async () => {
  serveFiles({});
  const openContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: false },
  });
  const res = await getPageConfig(openContext, { path: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, unmatched path, no user, authEnforcement null, returns not_found', async () => {
  serveFiles({});
  const res = await getPageConfig(context, { path: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, unmatched path, no user, authEnforcement has no pagesProtectedByDefault key, returns not_found', async () => {
  serveFiles({});
  const noKeyContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: {},
  });
  const res = await getPageConfig(noKeyContext, { path: 'doesNotExist' });
  expect(res).toEqual({ status: 'not_found' });
});

test('getPageConfig, unmatched path, no user, pagesProtectedByDefault true, returns unauthenticated', async () => {
  serveFiles({});
  const protectedContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: true },
  });
  const res = await getPageConfig(protectedContext, { path: 'doesNotExist' });
  expect(res).toEqual({ status: 'unauthenticated' });
});

test('getPageConfig, existing page, enrol_required, returns enrol_required with no pageConfig', async () => {
  serveFiles({
    'pages/pageId.json': {
      id: 'page:pageId',
      auth: {
        public: false,
      },
    },
  });
  const enrolContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { twoFactorRequired: true, twoFactorEnrolPageId: 'enrol' },
    user: { sub: 'sub', roles: [], two_factor_enrolled: false },
  });
  const res = await getPageConfig(enrolContext, { path: 'pageId' });
  expect(res).toEqual({ status: 'enrol_required', pageId: 'pageId', pathParams: {} });
  expect(res.pageConfig).toBe(undefined);
});

test('getPageConfig, gate is called with pageConfig and { pageId }', async () => {
  const pageConfig = {
    id: 'page:pageId',
    auth: {
      public: true,
    },
  };
  serveFiles({ 'pages/pageId.json': pageConfig });
  const spiedContext = testContext({ readConfigFile: mockReadConfigFile });
  spiedContext.authorizeOutcome = jest.fn(() => 'allow');
  await getPageConfig(spiedContext, { path: 'pageId' });
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
    if (path === 'routes.json') return routes;
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
  const res = await getPageConfig(context, { path: 'pageId', urlQuery: {} });
  expect(res.status).toBe('ok');
  const dynamicBlock = res.pageConfig.slots.content.blocks[0];
  expect(dynamicBlock.slots.content.blocks[0].properties.html).toBe('resolved');
  expect(dynamicBlock.properties.endpointId).toBe(undefined);
  // The fileCache-cached config object is untouched by resolution.
  const cachedDynamicBlock = cachedPageConfig.slots.content.blocks[0];
  expect(cachedDynamicBlock.properties.endpointId).toBe('resolve_section');
  expect(cachedDynamicBlock.slots).toBe(undefined);
});

test('getPageConfig matches a patterned path and loads the matched page by id', async () => {
  serveFiles({
    'pages/ticket.json': {
      id: 'page:ticket',
      path: '{space}/tickets/{ticket_id}',
      linkPaths: {},
      auth: { public: true },
    },
  });
  const res = await getPageConfig(context, { path: 'support/tickets/1234' });
  expect(res).toEqual({
    status: 'ok',
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: '1234' },
    pageConfig: {
      id: 'page:ticket',
      path: '{space}/tickets/{ticket_id}',
      linkPaths: {},
    },
  });
  expect(mockReadConfigFile).toHaveBeenCalledWith('pages/ticket.json');
});

test('getPageConfig, unmatched patterned path, no user, pagesProtectedByDefault true, returns unauthenticated', async () => {
  serveFiles({});
  const protectedContext = testContext({
    readConfigFile: mockReadConfigFile,
    authEnforcement: { pagesProtectedByDefault: true },
  });
  const res = await getPageConfig(protectedContext, { path: 'support/tickets' });
  expect(res).toEqual({ status: 'unauthenticated' });
});

test('getPageConfig, dynamic page passes pathParams to the Dynamic endpoint payload', async () => {
  const dynamicPage = {
    id: 'page:ticket',
    pageId: 'ticket',
    blockId: 'ticket',
    type: 'Box',
    dynamic: true,
    auth: { public: true },
    requests: [],
    slots: {
      content: {
        blocks: [
          {
            id: 'block:ticket:section_1:0',
            blockId: 'section_1',
            type: 'Dynamic',
            properties: { endpointId: 'resolve_section' },
          },
        ],
      },
    },
  };
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'routes.json') return routes;
    if (path === 'pages/ticket.json') return dynamicPage;
    if (path === 'types.json') {
      return {
        actions: {},
        blocks: { Box: {}, Dynamic: {}, Html: {} },
        operators: { client: {}, server: {} },
      };
    }
    if (path === 'api/resolve_section.json') {
      return {
        endpointId: 'resolve_section',
        type: 'InternalApi',
        auth: { public: true },
        routine: {
          ':return': {
            blocks: [
              {
                id: 'generated',
                type: 'Html',
                properties: { html: { _payload: 'pathParams.ticket_id' } },
              },
            ],
          },
        },
      };
    }
    return null;
  });
  const operatorsContext = testContext({
    readConfigFile: mockReadConfigFile,
    operators: operatorsServer,
  });
  const res = await getPageConfig(operatorsContext, {
    path: 'support/tickets/1234',
    urlQuery: {},
  });
  expect(res.status).toBe('ok');
  const dynamicBlock = res.pageConfig.slots.content.blocks[0];
  expect(dynamicBlock.slots.content.blocks[0].properties.html).toBe('1234');
});
