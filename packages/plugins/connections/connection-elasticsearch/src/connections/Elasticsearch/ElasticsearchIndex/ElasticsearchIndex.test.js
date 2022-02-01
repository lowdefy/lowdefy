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

import { Client } from '@elastic/elasticsearch';
import { validate } from '@lowdefy/ajv';

import ElasticsearchIndex from './ElasticsearchIndex.js';

const { checkRead, checkWrite } = ElasticsearchIndex.meta;
const schema = ElasticsearchIndex.schema;

const mockElasticsearchClient = jest.fn(() => mockElasticsearchClient);
mockElasticsearchClient.index = jest.fn(() => mockElasticsearchClient);
jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => mockElasticsearchClient),
}));

const connection = {
  node: 'http://node',
  index: 'test',
};

test('valid request schema', () => {
  const request = {
    id: '42',
    body: {
      foo: 'bar',
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});
test('valid request schema, numeric ID', () => {
  const request = {
    id: 42,
    body: {
      foo: 'bar',
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, no ID', () => {
  const request = {
    body: {
      foo: 'bar',
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, empty document', () => {
  const request = {
    body: {},
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request no body', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'ElasticsearchIndex request should have required property "body".'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('ElasticsearchIndex', async () => {
  const responseData = {
    body: {
      _index: 'test',
      _type: '_doc',
      _id: '42',
      _version: 1,
      result: 'created',
      _shards: {
        total: 2,
        successful: 1,
        failed: 0,
      },
      _seq_no: 1,
      _primary_term: 1,
    },
  };
  mockElasticsearchClient.index.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    id: 42,
    body: {
      foo: 'bar',
    },
  };
  const res = await ElasticsearchIndex({ request, connection });
  expect(Client.mock.calls).toEqual([
    [
      {
        node: 'http://node',
        index: 'test',
      },
    ],
  ]);
  expect(mockElasticsearchClient.index.mock.calls).toEqual([
    [
      {
        body: {
          foo: 'bar',
        },
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
      result: 'created',
      _shards: {
        total: 2,
        successful: 1,
        failed: 0,
      },
      _seq_no: 1,
      _primary_term: 1,
    },
  });
});
