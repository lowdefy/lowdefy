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

import createPageController from './pageController';
import { testBootstrapContext } from '../test/testContext';

const mockLoadPage = jest.fn();
const loaders = {
  page: {
    load: mockLoadPage,
  },
};

const context = testBootstrapContext({ loaders });

beforeEach(() => {
  mockLoadPage.mockReset();
});

test('getPage, public', async () => {
  mockLoadPage.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
        auth: {
          public: true,
        },
      };
    }
    return null;
  });
  const controller = createPageController(context);
  const res = await controller.getPage({ pageId: 'pageId' });
  expect(res).toEqual({
    id: 'page:pageId',
    auth: {
      public: true,
    },
  });
});

test('getPage, protected, no user', async () => {
  mockLoadPage.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
        auth: {
          public: false,
        },
      };
    }
    return null;
  });
  const controller = createPageController(context);
  const res = await controller.getPage({ pageId: 'pageId' });
  expect(res).toEqual(null);
});

test('getPage, protected, with user', async () => {
  mockLoadPage.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
        auth: {
          public: false,
        },
      };
    }
    return null;
  });
  const controller = createPageController(testBootstrapContext({ loaders, user: { sub: 'sub' } }));
  const res = await controller.getPage({ pageId: 'pageId' });
  expect(res).toEqual({
    id: 'page:pageId',
    auth: {
      public: false,
    },
  });
});

test('getPage, page does not exist', async () => {
  mockLoadPage.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
        auth: {
          public: true,
        },
      };
    }
    return null;
  });
  const controller = createPageController(context);
  const res = await controller.getPage({ pageId: 'doesNotExist' });
  expect(res).toEqual(null);
});
