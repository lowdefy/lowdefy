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
