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
mockElasticsearchClient.delete = jest.fn(() => mockElasticsearchClient);
jest.unstable_mockModule('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => mockElasticsearchClient),
}));

const connection = {
  node: 'http://node',
  index: 'test',
};

test('valid request schema', async () => {
  const ElasticsearchDelete = (await import('./ElasticsearchDelete.js')).default;
  const schema = ElasticsearchDelete.schema;
  const request = {
    id: '42',
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});
test('valid request schema, numeric ID', async () => {
  const ElasticsearchDelete = (await import('./ElasticsearchDelete.js')).default;
  const schema = ElasticsearchDelete.schema;
  const request = {
    id: 42,
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request no ID', async () => {
  const ElasticsearchDelete = (await import('./ElasticsearchDelete.js')).default;
  const schema = ElasticsearchDelete.schema;
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'ElasticsearchDelete request should have required property "id".'
  );
});

test('checkRead should be false', async () => {
  const ElasticsearchDelete = (await import('./ElasticsearchDelete.js')).default;
  const { checkRead } = ElasticsearchDelete.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const ElasticsearchDelete = (await import('./ElasticsearchDelete.js')).default;
  const { checkWrite } = ElasticsearchDelete.meta;
  expect(checkWrite).toBe(true);
});

test('ElasticsearchDelete', async () => {
  const { Client } = await import('@elastic/elasticsearch');
  const ElasticsearchDelete = (await import('./ElasticsearchDelete.js')).default;
  const responseData = {
    body: {
      _index: 'test',
      _type: '_doc',
      _id: '42',
      _version: 1,
      result: 'deleted',
      _shards: { total: 2, successful: 1, failed: 0 },
      _seq_no: 1,
      _primary_term: 1,
    },
  };
  mockElasticsearchClient.delete.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    id: 42,
  };
  const res = await ElasticsearchDelete({ request, connection });
  expect(Client.mock.calls).toEqual([
    [
      {
        node: 'http://node',
        index: 'test',
      },
    ],
  ]);
  expect(mockElasticsearchClient.delete.mock.calls).toEqual([
    [
      {
        index: 'test',
        id: 42,
      },
    ],
  ]);
  expect(res).toEqual({
    id: '42',
    response: {
      _index: 'test',
      _type: '_doc',
      _id: '42',
      _version: 1,
      result: 'deleted',
      _shards: { total: 2, successful: 1, failed: 0 },
      _seq_no: 1,
      _primary_term: 1,
    },
  });
});
