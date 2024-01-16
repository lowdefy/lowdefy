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
mockElasticsearchClient.update = jest.fn(() => mockElasticsearchClient);

jest.unstable_mockModule('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => mockElasticsearchClient),
}));

const connection = {
  node: 'http://node',
  index: 'test',
};

test('valid request schema', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const schema = ElasticsearchUpdate.schema;
  const request = {
    id: '42',
    body: {
      doc: {},
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, numeric ID', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const schema = ElasticsearchUpdate.schema;
  const request = {
    id: 42,
    body: {
      doc: {},
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request no ID', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const schema = ElasticsearchUpdate.schema;
  const request = {
    body: {
      doc: {},
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'ElasticsearchUpdate request should have required property "id".'
  );
});

test('request no body', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const schema = ElasticsearchUpdate.schema;
  const request = {
    id: 42,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'ElasticsearchUpdate request should have required property "body".'
  );
});

test('request neither script nor doc in body', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const schema = ElasticsearchUpdate.schema;
  const request = {
    id: 42,
    body: {},
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'ElasticsearchUpdate request should have required property "body.doc" or "body.script".'
  );
});

test('request invalid script in body', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const schema = ElasticsearchUpdate.schema;
  const request = {
    id: 42,
    body: {
      script: {
        foo: 'bar',
      },
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'must have required property \'source\'; ElasticsearchUpdate request should have required property "body.script.source" or "body.script.id".'
  );
});

test('checkRead should be false', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const { checkRead } = ElasticsearchUpdate.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const { checkWrite } = ElasticsearchUpdate.meta;
  expect(checkWrite).toBe(true);
});

test('ElasticsearchUpdate', async () => {
  const { Client } = await import('@elastic/elasticsearch');
  const ElasticsearchUpdate = (await import('./ElasticsearchUpdate.js')).default;
  const responseData = {
    body: {
      _index: 'test',
      _type: '_doc',
      _id: '42',
      _version: 1,
      result: 'updated',
      forced_refresh: true,
      _shards: { total: 2, successful: 1, failed: 0 },
      _seq_no: 1,
      _primary_term: 1,
    },
  };
  mockElasticsearchClient.update.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    id: 42,
    body: {
      doc: {
        foo: 'bar',
      },
    },
  };
  const res = await ElasticsearchUpdate({ request, connection });
  expect(Client.mock.calls).toEqual([
    [
      {
        node: 'http://node',
        index: 'test',
      },
    ],
  ]);
  expect(mockElasticsearchClient.update.mock.calls).toEqual([
    [
      {
        index: 'test',
        id: 42,
        body: {
          doc: {
            foo: 'bar',
          },
        },
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
      result: 'updated',
      forced_refresh: true,
      _shards: { total: 2, successful: 1, failed: 0 },
      _seq_no: 1,
      _primary_term: 1,
    },
  });
});
