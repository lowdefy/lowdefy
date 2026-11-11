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

import { beforeEach, expect, test } from 'vitest';

import stubRequest from './stubRequest.js';

let testSession;
beforeEach(() => {
  testSession = {
    closed: false,
    runtime: {
      connections: {
        AxiosHttp: { requests: { AxiosHttp: async () => null } },
        MongoDBCollection: {
          requests: { MongoDBFind: async () => [], MongoDBInsertOne: async () => {} },
        },
        Mcp: {},
      },
    },
    stubs: new Map(),
  };
});

test('stubRequest keeps the stub by connection type and request type, and a second stub replaces the first', () => {
  const first = () => 1;
  const second = () => 2;
  stubRequest({ connectionType: 'AxiosHttp', fn: first, requestType: 'AxiosHttp', testSession });
  expect(testSession.stubs.get('AxiosHttp').get('AxiosHttp')).toBe(first);
  stubRequest({ connectionType: 'AxiosHttp', fn: second, requestType: 'AxiosHttp', testSession });
  expect(testSession.stubs.get('AxiosHttp').get('AxiosHttp')).toBe(second);
});

test('stubRequest refuses a connection type the app does not use, naming the ones it does', () => {
  expect(() =>
    stubRequest({ connectionType: 'Knex', fn: () => [], requestType: 'KnexRaw', testSession })
  ).toThrow(
    'Connection type "Knex" is not used by this app. Its connection types are "AxiosHttp", "Mcp", "MongoDBCollection".'
  );
});

test('stubRequest refuses a request type the connection type does not have, naming the ones it has', () => {
  expect(() =>
    stubRequest({
      connectionType: 'MongoDBCollection',
      fn: () => [],
      requestType: 'MongoDBFindMany',
      testSession,
    })
  ).toThrow(
    'Request type "MongoDBFindMany" is not a request of connection type "MongoDBCollection". Its request types are "MongoDBFind", "MongoDBInsertOne".'
  );
  expect(() =>
    stubRequest({ connectionType: 'Mcp', fn: () => [], requestType: 'McpCall', testSession })
  ).toThrow(
    'Request type "McpCall" is not a request of connection type "Mcp". Its request types are .'
  );
});

test('stubRequest refuses an answer that is not a function, and a closed session', () => {
  expect(() =>
    stubRequest({
      connectionType: 'AxiosHttp',
      fn: { data: 1 },
      requestType: 'AxiosHttp',
      testSession,
    })
  ).toThrow(
    'stub takes a function that answers the request. Received {"data":1} for AxiosHttp AxiosHttp.'
  );
  testSession.closed = true;
  expect(() =>
    stubRequest({ connectionType: 'AxiosHttp', fn: () => 1, requestType: 'AxiosHttp', testSession })
  ).toThrow('The session is closed');
});
