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

import writeRequests from './writeRequests';
import testContext from '../test/testContext';

const mockSet = jest.fn();

const artifactSetter = {
  set: mockSet,
};

const context = testContext({ artifactSetter });

beforeEach(() => {
  mockSet.mockReset();
});

test('writeRequests write request', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:page1:request1',
            requestId: 'request1',
            connectionId: 'connection1',
            properties: { key: 'value' },
          },
        ],
        mutations: [],
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'pages/page1/requests/request1.json',
        content: `{
  "id": "request:page1:page1:request1",
  "requestId": "request1",
  "connectionId": "connection1",
  "properties": {
    "key": "value"
  }
}`,
      },
    ],
  ]);
});

test('writeRequests write nested request', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
                requests: [
                  {
                    id: 'request:page1:page1:request1',
                    requestId: 'request1',
                    connectionId: 'connection1',
                    properties: { key: 'value' },
                  },
                ],
              },
            ],
          },
        },
        mutations: [],
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'pages/page1/requests/request1.json',
        content: `{
  "id": "request:page1:page1:request1",
  "requestId": "request1",
  "connectionId": "connection1",
  "properties": {
    "key": "value"
  }
}`,
      },
    ],
  ]);
});

test('writeRequests add mutation', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [],
        mutations: [
          {
            id: 'mutation:page1:page1:mutation1',
            mutationId: 'mutation1',
            connectionId: 'connection1',
            properties: { key: 'value' },
          },
        ],
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'pages/page1/mutations/mutation1.json',
        content: `{
  "id": "mutation:page1:page1:mutation1",
  "mutationId": "mutation1",
  "connectionId": "connection1",
  "properties": {
    "key": "value"
  }
}`,
      },
    ],
  ]);
});

test('writeRequests add nested mutation', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
                mutations: [
                  {
                    id: 'mutation:page1:page1:mutation1',
                    mutationId: 'mutation1',
                    connectionId: 'connection1',
                    properties: { key: 'value' },
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'pages/page1/mutations/mutation1.json',
        content: `{
  "id": "mutation:page1:page1:mutation1",
  "mutationId": "mutation1",
  "connectionId": "connection1",
  "properties": {
    "key": "value"
  }
}`,
      },
    ],
  ]);
});

test('writeRequests requests is not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: 'requests',
      },
    ],
  };
  await expect(writeRequests({ components, context })).rejects.toThrow(
    'Requests is not an array on page "page1"'
  );
});

test('writeRequests mutations is not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        mutations: 'mutations',
      },
    ],
  };
  await expect(writeRequests({ components, context })).rejects.toThrow(
    'Mutations is not an array on page "page1"'
  );
});

test('writeRequests empty pages array', async () => {
  const components = {
    pages: [],
  };
  await writeRequests({ components, context });
  expect(mockSet.mock.calls).toEqual([]);
});

test('writeRequests no pages array', async () => {
  const components = {};
  await writeRequests({ components, context });
  expect(mockSet.mock.calls).toEqual([]);
});

test('writeRequests pages not an array', async () => {
  const components = {
    pages: 'pages',
  };
  await expect(writeRequests({ components, context })).rejects.toThrow('Pages is not an array.');
});

test('writeRequests page is not a object', async () => {
  const components = {
    pages: ['page'],
  };
  await expect(writeRequests({ components, context })).rejects.toThrow('Page is not an object.');
});

test('writeRequests to throw when blocks is not a array', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        areas: {
          content: {
            blocks: 'blocks',
          },
        },
      },
    ],
  };
  await expect(writeRequests({ components, context })).rejects.toThrow(
    'Blocks is not an array on page "page1", block "page1", area "content".'
  );
});

test('writeRequests to throw when block is not an object', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        areas: {
          content: {
            blocks: ['block'],
          },
        },
      },
    ],
  };
  await expect(writeRequests({ components, context })).rejects.toThrow(
    'Block is not an object on page "page1".'
  );
});

test('writeRequests deletes request properties', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:page1:request1',
            requestId: 'request1',
            connectionId: 'connection1',
            properties: { key: 'value' },
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
                requests: [
                  {
                    id: 'request:request2',
                    requestId: 'request1',
                    connectionId: 'connection1',
                    properties: { key: 'value' },
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  };
  await writeRequests({ components, context });
  expect(components).toEqual({
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:page1:request1',
            requestId: 'request1',
            connectionId: 'connection1',
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
                requests: [
                  {
                    id: 'request:request2',
                    requestId: 'request1',
                    connectionId: 'connection1',
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  });
});

test('writeRequests deletes mutation properties', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        mutations: [
          {
            id: 'mutation:page1:page1:mutation1',
            mutationId: 'mutation1',
            connectionId: 'connection1',
            properties: { key: 'value' },
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
                mutations: [
                  {
                    id: 'mutation:mutation2',
                    mutationId: 'mutation2',
                    connectionId: 'connection1',
                    properties: { key: 'value' },
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  };
  await writeRequests({ components, context });
  expect(components).toEqual({
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        mutations: [
          {
            id: 'mutation:page1:page1:mutation1',
            mutationId: 'mutation1',
            connectionId: 'connection1',
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
                mutations: [
                  {
                    id: 'mutation:mutation2',
                    mutationId: 'mutation2',
                    connectionId: 'connection1',
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  });
});
