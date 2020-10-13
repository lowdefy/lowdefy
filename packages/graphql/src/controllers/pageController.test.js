/*
   Copyright 2020 Lowdefy, Inc

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

const mockLoadPage = jest.fn();
const loaders = {
  page: {
    load: mockLoadPage,
  },
};

const getLoader = jest.fn((loader) => loaders[loader]);

const context = {
  getLoader,
};

beforeEach(() => {
  mockLoadPage.mockReset();
});

test('getPage', async () => {
  mockLoadPage.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
      };
    }
    return null;
  });
  const controller = createPageController(context);
  const res = await controller.getPage({ pageId: 'pageId' });
  expect(res).toEqual({
    id: 'page:pageId',
  });
});

test('getPage, page does not exist', async () => {
  mockLoadPage.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
      };
    }
    return null;
  });
  const controller = createPageController(context);
  const res = await controller.getPage({ pageId: 'doesNotExist' });
  expect(res).toEqual(null);
});
