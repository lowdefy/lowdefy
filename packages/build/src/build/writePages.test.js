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

import writePages from './writePages';
import testContext from '../test/testContext';

const mockSet = jest.fn();

const artifactSetter = {
  set: mockSet,
};

const context = testContext({ artifactSetter });

beforeEach(() => {
  mockSet.mockReset();
});

test('writePages write page', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        requests: [],
        mutations: [],
      },
    ],
  };
  await writePages({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'pages/page1/page1.json',
        content: `{
  "id": "page:page1",
  "pageId": "page1",
  "blockId": "page1",
  "requests": [],
  "mutations": []
}`,
      },
    ],
  ]);
});

test('writePages multiple pages', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        requests: [],
        mutations: [],
      },
      {
        id: 'page:page2',
        pageId: 'page2',
        blockId: 'page2',
        requests: [],
        mutations: [],
      },
    ],
  };
  await writePages({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'pages/page1/page1.json',
        content: `{
  "id": "page:page1",
  "pageId": "page1",
  "blockId": "page1",
  "requests": [],
  "mutations": []
}`,
      },
    ],
    [
      {
        filePath: 'pages/page2/page2.json',
        content: `{
  "id": "page:page2",
  "pageId": "page2",
  "blockId": "page2",
  "requests": [],
  "mutations": []
}`,
      },
    ],
  ]);
});

test('writePages no pages', async () => {
  const components = {
    pages: [],
  };
  await writePages({ components, context });
  expect(mockSet.mock.calls).toEqual([]);
});

test('writePages pages undefined', async () => {
  const components = {};
  await writePages({ components, context });
  expect(mockSet.mock.calls).toEqual([]);
});

test('writePages pages not an array', async () => {
  const components = {
    pages: 'pages',
  };
  await expect(writePages({ components, context })).rejects.toThrow('Pages is not an array.');
});

test('writePages page is not an object', async () => {
  const components = {
    pages: ['page'],
  };
  await expect(writePages({ components, context })).rejects.toThrow(
    'Page is not an object. Received "page"'
  );
});
