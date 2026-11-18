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

import { vi, expect, test } from 'vitest';
import { validate } from '@lowdefy/ajv';

const mockElasticsearchClient = vi.fn(function () {
  return mockElasticsearchClient;
});
mockElasticsearchClient.search = vi.fn(function () {
  return mockElasticsearchClient;
});
mockElasticsearchClient.close = vi.fn(function () {
  return Promise.resolve();
});
vi.doMock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(function () {
    return mockElasticsearchClient;
  }),
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
    sort: ['name', { age: 'desc' }],
    aggs: {
      nameAggregation: {
        terms: {
          field: 'name',
        },
      },
    },
    query: {
      bool: {
        should: [
          {
            term: {
              name: 'foo',
            },
          },
        ],
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

test('request with body is rejected', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const schema = ElasticsearchSearch.schema;
  const request = {
    body: {
      query: {
        match_all: {},
      },
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'was removed in Lowdefy 8 (Elasticsearch client 9).'
  );
});

test('request with type is rejected', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const schema = ElasticsearchSearch.schema;
  const request = {
    type: 'article',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'was removed in Elasticsearch 8. Mapping types no longer exist'
  );
});

test('ElasticsearchSearch with match_all query', async () => {
  const { Client } = await import('@elastic/elasticsearch');
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;

  const responseData = {
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
          _id: '1',
          _score: 1,
          _source: {
            name: 'foo',
          },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: {
            name: 'bar',
          },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: {
            name: 'baz',
          },
        },
      ],
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(function () {
    return Promise.resolve(responseData);
  });
  const request = {
    size: 3,
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
        },
        name: 'foo',
      },
      {
        _meta: {
          _id: '2',
          _index: 'test',
          _score: 1,
        },
        name: 'bar',
      },
      {
        _meta: {
          _id: '3',
          _index: 'test',
          _score: 1,
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
          },
          {
            _id: '2',
            _index: 'test',
            _score: 1,
            _source: {
              name: 'bar',
            },
          },
          {
            _id: '3',
            _index: 'test',
            _score: 1,
            _source: {
              name: 'baz',
            },
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
  expect(mockElasticsearchClient.close).toHaveBeenCalledTimes(1);
});

test('ElasticsearchSearch exposes total results', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
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
          _id: '1',
          _score: 1,
          _source: {
            name: 'foo',
          },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: {
            name: 'bar',
          },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: {
            name: 'baz',
          },
        },
      ],
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(function () {
    return Promise.resolve(responseData);
  });
  const request = {
    size: 3,
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
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.total).toEqual({ relation: 'eq', value: 1234 });
});

test('ElasticsearchSearch exposes total results over 10k as Infinity', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
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
          _id: '1',
          _score: 1,
          _source: {
            name: 'foo',
          },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: {
            name: 'bar',
          },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: {
            name: 'baz',
          },
        },
      ],
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(function () {
    return Promise.resolve(responseData);
  });
  const request = {
    size: 3,
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
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.total).toEqual({ relation: 'gte', value: 10000 });
});

test('ElasticsearchSearch exposes maximum score', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
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
          _id: '1',
          _score: 1,
          _source: {
            name: 'foo',
          },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: {
            name: 'bar',
          },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: {
            name: 'baz',
          },
        },
      ],
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(function () {
    return Promise.resolve(responseData);
  });
  const request = {
    size: 3,
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
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.maxScore).toEqual(42);
});

test('ElasticsearchSearch exposes aggregations', async () => {
  const ElasticsearchSearch = (await import('./ElasticsearchSearch.js')).default;
  const responseData = {
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
          _id: '1',
          _score: 1,
          _source: {
            name: 'foo',
          },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: {
            name: 'bar',
          },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: {
            name: 'baz',
          },
        },
      ],
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(function () {
    return Promise.resolve(responseData);
  });
  const request = {
    size: 3,
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
          _id: '1',
          _score: 1,
          _source: {
            name: 'foo',
          },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: {
            name: 'bar',
          },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: {
            name: 'baz',
          },
        },
      ],
    },
  };
  mockElasticsearchClient.search.mockImplementationOnce(function () {
    return Promise.resolve(responseData);
  });
  const request = {
    size: 3,
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
  };
  const res = await ElasticsearchSearch({ request, connection });
  expect(res.response).toEqual(responseData);
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
