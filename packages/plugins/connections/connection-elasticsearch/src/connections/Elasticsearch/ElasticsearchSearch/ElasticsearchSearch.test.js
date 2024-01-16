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
mockElasticsearchClient.search = jest.fn(() => mockElasticsearchClient);

jest.unstable_mockModule('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => mockElasticsearchClient),
}));

const connection = {
  node: 'http://node',
  index: 'test',
};

test('valid request schema', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const schema = ElasticsearchSearch.schema;
  const request = {
    size: 42,
    human: true,
    pretty: false,
    track_total_hits: true,
    version: false,
    _source_excludes: ['age'],
    _source_includes: ['name'],
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        boolean: {
          should: [
            {
              term: {
                name: 'foo',
              },
            },
          ],
        },
      },
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid empty request schema', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const schema = ElasticsearchSearch.schema;
  const request = {};
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('ElasticsearchSearch with match_all query', async () => {
  const { Client } = await import('@elastic/elasticsearch');
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;

  const responseData = {
    body: {
      took: 1234,
      timed_out: false,
      _shards: {},
      aggregations: {
        nameAggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
      },
      hits: {
        total: {
          value: 10000,
          relation: 'gte',
        },
        max_score: 1,
        hits: [
          {
            _index: 'test',
            _type: '_doc',
            _id: '1',
            _score: 1,
            _source: {
              name: 'foo',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '2',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '3',
            _score: 1,
            _source: {
              name: 'baz',
            },
          },
        ],
      },
    },
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-length': '1234567',
    },
    meta: {
      context: null,
      request: {},
      name: 'elasticsearch-js',
      connection: {},
      attempts: 0,
      aborted: false,
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    size: 3,
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        match_all: {},
      },
    },
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(Client.mock.calls).toEqual([
    [
      {
        node: 'http://node',
        index: 'test',
      },
    ],
  ]);
  expect(mockElasticsearchClient.search.mock.calls).toEqual([
    [
      {
        body: {
          query: {
            match_all: {},
          },
          aggs: {
            nameAggregation: {
              terms: {
                field: 'name',
              },
            },
          },
        },
        index: 'test',
        size: 3,
      },
    ],
  ]);
  expect(res).toEqual({
    aggregations: {
      nameAggregation: {
        buckets: [],
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
      },
    },
    hits: [
      {
        _meta: {
          _id: '1',
          _index: 'test',
          _score: 1,
          _type: '_doc',
        },
        name: 'foo',
      },
      {
        _meta: {
          _id: '2',
          _index: 'test',
          _score: 1,
          _type: '_doc',
        },
        name: 'bar',
      },
      {
        _meta: {
          _id: '3',
          _index: 'test',
          _score: 1,
          _type: '_doc',
        },
        name: 'baz',
      },
    ],
    maxScore: 1,
    response: {
      _shards: {},
      aggregations: {
        nameAggregation: {
          buckets: [],
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
        },
      },
      hits: {
        hits: [
          {
            _id: '1',
            _index: 'test',
            _score: 1,
            _source: {
              name: 'foo',
            },
            _type: '_doc',
          },
          {
            _id: '2',
            _index: 'test',
            _score: 1,
            _source: {
              name: 'bar',
            },
            _type: '_doc',
          },
          {
            _id: '3',
            _index: 'test',
            _score: 1,
            _source: {
              name: 'baz',
            },
            _type: '_doc',
          },
        ],
        max_score: 1,
        total: {
          relation: 'gte',
          value: 10000,
        },
      },
      timed_out: false,
      took: 1234,
    },
    total: {
      relation: 'gte',
      value: 10000,
    },
  });
});

test('ElasticsearchSearch exposes total results', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
    body: {
      took: 1234,
      timed_out: false,
      _shards: {},
      aggregations: {
        nameAggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
      },
      hits: {
        total: {
          value: 1234,
          relation: 'eq',
        },
        max_score: 1,
        hits: [
          {
            _index: 'test',
            _type: '_doc',
            _id: '1',
            _score: 1,
            _source: {
              name: 'foo',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '2',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '3',
            _score: 1,
            _source: {
              name: 'baz',
            },
          },
        ],
      },
    },
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-length': '1234567',
    },
    meta: {
      context: null,
      request: {},
      name: 'elasticsearch-js',
      connection: {},
      attempts: 0,
      aborted: false,
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    size: 3,
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        match_all: {},
      },
    },
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.total).toEqual({ relation: 'eq', value: 1234 });
});

test('ElasticsearchSearch exposes total results over 10k as Infinity', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
    body: {
      took: 1234,
      timed_out: false,
      _shards: {},
      aggregations: {
        nameAggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
      },
      hits: {
        total: {
          value: 10000,
          relation: 'gte',
        },
        max_score: 1,
        hits: [
          {
            _index: 'test',
            _type: '_doc',
            _id: '1',
            _score: 1,
            _source: {
              name: 'foo',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '2',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '3',
            _score: 1,
            _source: {
              name: 'baz',
            },
          },
        ],
      },
    },
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-length': '1234567',
    },
    meta: {
      context: null,
      request: {},
      name: 'elasticsearch-js',
      connection: {},
      attempts: 0,
      aborted: false,
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    size: 3,
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        match_all: {},
      },
    },
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.total).toEqual({ relation: 'gte', value: 10000 });
});

test('ElasticsearchSearch exposes maximum score', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
    body: {
      took: 1234,
      timed_out: false,
      _shards: {},
      aggregations: {
        nameAggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
      },
      hits: {
        total: {
          value: 10000,
          relation: 'gte',
        },
        max_score: 42,
        hits: [
          {
            _index: 'test',
            _type: '_doc',
            _id: '1',
            _score: 1,
            _source: {
              name: 'foo',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '2',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '3',
            _score: 1,
            _source: {
              name: 'baz',
            },
          },
        ],
      },
    },
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-length': '1234567',
    },
    meta: {
      context: null,
      request: {},
      name: 'elasticsearch-js',
      connection: {},
      attempts: 0,
      aborted: false,
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    size: 3,
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        match_all: {},
      },
    },
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.maxScore).toEqual(42);
});

test('ElasticsearchSearch exposes aggregations', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
    body: {
      took: 1234,
      timed_out: false,
      _shards: {},
      aggregations: {
        nameAggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
      },
      hits: {
        total: {
          value: 10000,
          relation: 'gte',
        },
        max_score: 1,
        hits: [
          {
            _index: 'test',
            _type: '_doc',
            _id: '1',
            _score: 1,
            _source: {
              name: 'foo',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '2',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '3',
            _score: 1,
            _source: {
              name: 'baz',
            },
          },
        ],
      },
    },
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-length': '1234567',
    },
    meta: {
      context: null,
      request: {},
      name: 'elasticsearch-js',
      connection: {},
      attempts: 0,
      aborted: false,
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    size: 3,
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        match_all: {},
      },
    },
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.aggregations).toEqual({
    nameAggregation: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [],
    },
  });
});

test('ElasticsearchSearch exposes original response body', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
    body: {
      took: 1234,
      timed_out: false,
      _shards: {},
      aggregations: {
        nameAggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
      },
      hits: {
        total: {
          value: 10000,
          relation: 'gte',
        },
        max_score: 1,
        hits: [
          {
            _index: 'test',
            _type: '_doc',
            _id: '1',
            _score: 1,
            _source: {
              name: 'foo',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '2',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _index: 'test',
            _type: '_doc',
            _id: '3',
            _score: 1,
            _source: {
              name: 'baz',
            },
          },
        ],
      },
    },
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-length': '1234567',
    },
    meta: {
      context: null,
      request: {},
      name: 'elasticsearch-js',
      connection: {},
      attempts: 0,
      aborted: false,
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(() => Promise.resolve(responseData));
  const request = {
    size: 3,
    body: {
      aggs: {
        nameAggregation: {
          terms: {
            field: 'name',
          },
        },
      },
      query: {
        match_all: {},
      },
    },
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.response).toMatchObject(responseData.body);
});

test('checkRead should be true', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const { checkRead } = ElasticsearchSearch.meta;
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const { checkWrite } = ElasticsearchSearch.meta;
  expect(checkWrite).toBe(false);
});
