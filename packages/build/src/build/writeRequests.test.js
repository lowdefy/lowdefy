/*
  Copyright 2020-2024 Lowdefy, Inc

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

import writeRequests from './writeRequests.js';
import testContext from '../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeRequests write request', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:request1',
            requestId: 'request1',
            pageId: 'page1',
            connectionId: 'connection1',
            auth: { public: true },
            type: 'Request',
            payload: {},
            properties: { key: 'value' },
          },
        ],
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'pages/page1/requests/request1.json',
      '{"id":"request:page1:request1","requestId":"request1","pageId":"page1","connectionId":"connection1","auth":{"public":true},"type":"Request","payload":{},"properties":{"key":"value"}}',
    ],
  ]);
});

test('writeRequests write multiple requests on a page', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:request1',
            requestId: 'request1',
            pageId: 'page1',
            connectionId: 'connection1',
            auth: { public: true },
            type: 'Request',
            payload: {},
            properties: { key: 'value' },
          },
          {
            id: 'request:page1:request2',
            requestId: 'request2',
            pageId: 'page1',
            connectionId: 'connection1',
            auth: { public: true },
            type: 'Request',
            payload: {},
            properties: { key: 'value' },
          },
        ],
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'pages/page1/requests/request1.json',
      '{"id":"request:page1:request1","requestId":"request1","pageId":"page1","connectionId":"connection1","auth":{"public":true},"type":"Request","payload":{},"properties":{"key":"value"}}',
    ],
    [
      'pages/page1/requests/request2.json',
      '{"id":"request:page1:request2","requestId":"request2","pageId":"page1","connectionId":"connection1","auth":{"public":true},"type":"Request","payload":{},"properties":{"key":"value"}}',
    ],
  ]);
});

test('writeRequests write requests on a for multiple pages', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:request1',
            requestId: 'request1',
            pageId: 'page1',
            connectionId: 'connection1',
            auth: { public: true },
            type: 'Request',
            payload: {},
            properties: { key: 'value' },
          },
        ],
      },
      {
        id: 'page:page2',
        pageId: 'page2',
        requests: [
          {
            id: 'request:page2:request1',
            requestId: 'request1',
            pageId: 'page2',
            connectionId: 'connection1',
            auth: { public: true },
            type: 'Request',
            payload: {},
            properties: { key: 'value' },
          },
        ],
      },
    ],
  };
  await writeRequests({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'pages/page1/requests/request1.json',
      '{"id":"request:page1:request1","requestId":"request1","pageId":"page1","connectionId":"connection1","auth":{"public":true},"type":"Request","payload":{},"properties":{"key":"value"}}',
    ],
    [
      'pages/page2/requests/request1.json',
      '{"id":"request:page2:request1","requestId":"request1","pageId":"page2","connectionId":"connection1","auth":{"public":true},"type":"Request","payload":{},"properties":{"key":"value"}}',
    ],
  ]);
});

test('writeRequests empty pages array', async () => {
  const components = {
    pages: [],
  };
  await writeRequests({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});

test('writeRequests deletes request properties', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        requests: [
          {
            id: 'request:page1:request1',
            requestId: 'request1',
            type: 'RequestType',
            connectionId: 'connection1',
            payload: { payload: 1 },
            auth: { public: true },
            properties: { key: 'value' },
          },
          {
            id: 'request:page1:request2',
            requestId: 'request2',
            type: 'RequestType',
            connectionId: 'connection1',
            payload: { payload: 2 },
            auth: { public: true },
            properties: { key: 'value' },
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
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
            id: 'request:page1:request1',
            requestId: 'request1',
            payload: { payload: 1 },
          },
          {
            id: 'request:page1:request2',
            requestId: 'request2',
            payload: { payload: 2 },
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:block1',
                blockId: 'block1',
              },
            ],
          },
        },
      },
    ],
  });
});
