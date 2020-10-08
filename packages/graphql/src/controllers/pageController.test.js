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

const mockLoadComponent = jest.fn();
const loaders = {
  page: {
    load: mockLoadComponent,
  },
};
const controllers = {};

const getLoader = jest.fn((loader) => loaders[loader]);
const getController = jest.fn((controller) => controllers[controller]);

beforeEach(() => {
  mockLoadComponent.mockReset();
});

test('getPage', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'pageId') {
      return {
        id: 'page:pageId',
      };
    }
    return null;
  });
  const controller = createPageController({
    getLoader,
    getController,
  });
  const res = await controller.getPage({ pageId: 'pageId' });
  expect(res).toEqual({
    id: 'page:pageId',
  });
});
