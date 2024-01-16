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
import { validate } from '@lowdefy/ajv';

const mockElasticsearchClient = jest.fn(() => mockElasticsearchClient);
mockElasticsearchClient.updateByQuery = jest.fn(() => mockElasticsearchClient);
jest.unstable_mockModule('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => mockElasticsearchClient),
}));

const connection = {
  node: 'http://node',
  index: 'test',
};

test('valid request schema', async () => {
  const ElasticsearchUpdateByQuery = (await import('./ElasticsearchUpdateByQuery.js')).default;
  const schema = ElasticsearchUpdateByQuery.schema;
  const request = {
    query: {
      match_all: {},
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, no query', async () => {
  const ElasticsearchUpdateByQuery = (await import('./ElasticsearchUpdateByQuery.js')).default;
  const schema = ElasticsearchUpdateByQuery.schema;
  const request = {};
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('checkRead should be false', async () => {
  const ElasticsearchUpdateByQuery = (await import('./ElasticsearchUpdateByQuery.js')).default;
  const { checkRead } = ElasticsearchUpdateByQuery.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const ElasticsearchUpdateByQuery = (await import('./ElasticsearchUpdateByQuery.js')).default;
  const { checkWrite } = ElasticsearchUpdateByQuery.meta;
  expect(checkWrite).toBe(true);
});

test('ElasticsearchUpdateByQuery', async () => {
  const { Client } = await import('@elastic/elasticsearch');
  const ElasticsearchUpdateByQuery = (await import('./ElasticsearchUpdateByQuery.js')).default;
  const responseData = {
    body: {
      took: 147,
      timed_out: false,
      total: 119,
      updated: 112,
      deleted: 7,
      batches: 1,
      version_conflicts: 0,
      noops: 0,
      retries: { bulk: 0, search: 0 },
      throttled_millis: 0,
      requests_per_second: -1.0,
      throttled_until_millis: 0,
      failures: [],
    },
  };
  mockElasticsearchClient.updateByQuery.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    query: {
      term: {
        foo: 'bar',
      },
    },
  };
  const res = await ElasticsearchUpdateByQuery({ request, connection });
  expect(Client.mock.calls).toEqual([
    [
      {
        node: 'http://node',
        index: 'test',
      },
    ],
  ]);
  expect(mockElasticsearchClient.updateByQuery.mock.calls).toEqual([
    [
      {
        index: 'test',
        query: {
          term: {
            foo: 'bar',
          },
        },
      },
    ],
  ]);
  expect(res).toEqual({
    response: {
      took: 147,
      timed_out: false,
      total: 119,
      updated: 112,
      deleted: 7,
      batches: 1,
      version_conflicts: 0,
      noops: 0,
      retries: { bulk: 0, search: 0 },
      throttled_millis: 0,
      requests_per_second: -1.0,
      throttled_until_millis: 0,
      failures: [],
    },
  });
});
