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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - ElasticsearchSearch',
  type: 'object',
  description: 'Returns the documents that match the query defined in the request.',
  properties: {
    query: {
      $ref: '#/definitions/Query',
    },
    aggs: {
      description:
        'The aggregations to run as part of the search. See https://www.elastic.co/docs/explore-analyze/query-filter/aggregations.',
      type: 'object',
    },
    aggregations: {
      description: 'Alias of "aggs".',
      type: 'object',
    },
    post_filter: {
      description:
        'A query that filters the hits after aggregations are calculated. Uses the Query DSL.',
      type: 'object',
    },
    highlight: {
      description: 'Highlight matches in one or more fields of the hits.',
      type: 'object',
    },
    collapse: {
      description: 'Collapse the hits by the values of a field.',
      type: 'object',
    },
    search_after: {
      description: 'Page through hits using the sort values of the last hit of the previous page.',
      type: 'array',
    },
    fields: {
      description:
        'Field names or patterns to return in the "fields" property of each hit, as formatted by the field mapping.',
      type: 'array',
    },
    knn: {
      description: 'Approximate k-nearest neighbor search on a dense vector field.',
      type: ['object', 'array'],
    },
    min_score: {
      description: 'Only return hits with a score of at least this value.',
      type: 'number',
    },
    runtime_mappings: {
      description: 'Runtime fields defined for this search.',
      type: 'object',
    },
    script_fields: {
      description: 'Fields calculated with a script for each hit.',
      type: 'object',
    },
    suggest: {
      description: 'Suggest terms or phrases similar to the given text.',
      type: 'object',
    },
    pit: {
      description: 'Search a point in time (PIT). A point in time search cannot set "index".',
      type: 'object',
    },
    body: {
      not: {},
      errorMessage:
        'was removed in Lowdefy 8 (Elasticsearch client 9). Move the keys in "body" (like "query" and "aggs") to the top level of the request properties',
    },
    _source: {
      description:
        'True or false to return the _source field or not, a list of fields to return, or an object with "includes" and "excludes" lists.',
      examples: [['id', 'name'], 'name', true, false, { excludes: ['body'] }],
      anyOf: [
        {
          type: 'object',
        },
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
        {
          type: 'boolean',
        },
      ],
    },
    _source_excludes: {
      description: 'A list of fields to exclude from the returned _source field.',
      examples: [['id', 'name'], 'name'],
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    _source_includes: {
      description: 'A list of fields to extract and return from the _source field.',
      examples: [['id', 'name'], 'name'],
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    allow_no_indices: {
      description:
        'Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).',
      type: 'boolean',
    },
    allow_partial_search_results: {
      description:
        'Indicate if an error should be returned if there is a partial search failure or timeout.',
      type: 'boolean',
      default: true,
    },
    analyze_wildcard: {
      description: 'Specify whether wildcard and prefix queries should be analyzed.',
      type: 'boolean',
      default: false,
    },
    analyzer: {
      description: 'The analyzer to use for the query string.',
      type: 'string',
    },
    batched_reduce_size: {
      description:
        'The number of shard results that should be reduced at once on the coordinating node. This value should be used as a protection mechanism to reduce the memory overhead per search request if the potential number of shards in the request can be large.',
      type: 'number',
      default: 512,
    },
    ccs_minimize_roundtrips: {
      description:
        'Indicates whether network round-trips should be minimized as part of cross-cluster search requests execution.',
      type: 'boolean',
      default: true,
    },
    default_operator: {
      description: 'The default operator for query string query (AND or OR).',
      enum: ['AND', 'OR'],
      type: 'string',
      default: 'OR',
    },
    df: {
      description:
        'The field to use as default where no field prefix is given in the query string.',
      type: 'string',
    },
    docvalue_fields: {
      description:
        'A comma-separated list of fields to return as the docvalue representation of a field for each hit.',
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    error_trace: {
      description: 'Include the stack trace of returned errors.',
      type: 'boolean',
    },
    expand_wildcards: {
      description:
        'Whether to expand wildcard expression to concrete indices that are open, closed or both.',
      enum: ['all', 'closed', 'hidden', 'none', 'open'],
      type: 'string',
      default: 'open',
    },
    explain: {
      description:
        'Specify whether to return detailed information about score computation as part of a hit.',
      type: 'boolean',
    },
    from: {
      description: 'Starting offset.',
      type: 'number',
      default: 0,
    },
    human: {
      description: 'Return human readable values for statistics.',
      type: 'boolean',
      default: true,
    },
    ignore_throttled: {
      description:
        'Whether specified concrete, expanded or aliased indices should be ignored when throttled.',
      type: 'boolean',
    },
    ignore_unavailable: {
      description:
        'Whether specified concrete indices should be ignored when unavailable (missing or closed)',
      type: 'boolean',
    },
    index: {
      description:
        'A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices.',
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
      examples: ['', '_all', 'my_index'],
    },
    lenient: {
      description:
        'Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.',
      type: 'boolean',
    },
    max_concurrent_shard_requests: {
      description:
        'The number of concurrent shard requests per node this search executes concurrently. This value should be used to limit the impact of the search on the cluster in order to limit the number of concurrent shard requests.',
      type: 'number',
      default: 5,
    },
    pre_filter_shard_size: {
      description:
        'A threshold that enforces a pre-filter roundtrip to prefilter search shards based on query rewriting if the number of shards the search request expands to exceeds the threshold. This filter roundtrip can limit the number of shards significantly if for instance a shard can not match any documents based on its rewrite method ie. if date filters are mandatory to match but the shard bounds and the query are disjoint.',
      type: 'number',
    },
    preference: {
      description: 'Specify the node or shard the operation should be performed on.',
      type: 'string',
      default: 'random',
    },
    pretty: {
      description: 'Pretty format the returned JSON response.',
      type: 'boolean',
    },
    q: {
      description: 'Query in the Lucene query string syntax.',
      type: 'string',
    },
    request_cache: {
      description:
        'Specify if request cache should be used for this request or not, defaults to index level setting.',
      type: 'boolean',
    },
    rest_total_hits_as_int: {
      description:
        'Indicates whether hits.total should be rendered as an integer or an object in the rest search response.',
      type: 'boolean',
    },
    routing: {
      description: 'A comma-separated list of specific routing values.',
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    scroll: {
      description:
        'Specify how long a consistent view of the index should be maintained for scrolled search.',
      type: 'string',
    },
    search_type: {
      description: 'Search operation type.',
      enum: ['dfs_query_then_fetch', 'query_then_fetch'],
      type: 'string',
    },
    seq_no_primary_term: {
      description:
        'Specify whether to return sequence number and primary term of the last modification of each hit',
      type: 'boolean',
    },
    size: {
      description: 'Number of hits to return.',
      type: 'number',
      default: 10,
    },
    sort: {
      description:
        'How to sort the hits, in the Elasticsearch sort syntax: a field name, or an array of field names and objects like { timestamp: desc }. A single "field:direction" string is also accepted.',
      examples: [
        'name',
        ['name', { timestamp: 'desc' }],
        { rating: { order: 'asc' } },
        'rating:asc',
      ],
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'object',
        },
        {
          type: 'array',
          items: {
            anyOf: [
              {
                type: 'string',
              },
              {
                type: 'object',
              },
            ],
          },
        },
      ],
    },
    stats: {
      description: 'Specific tag of the request for logging and statistical purposes',
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    stored_fields: {
      description: 'A comma-separated list of stored fields to return as part of a hit',
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    suggest_field: {
      description: 'Specify which field to use for suggestions',
      type: 'string',
    },
    suggest_mode: {
      description: 'Specify suggest mode',
      enum: ['always', 'missing', 'popular'],
      type: 'string',
      default: 'missing',
    },
    suggest_size: {
      description: 'How many suggestions to return in response',
      type: 'number',
    },
    suggest_text: {
      description: 'The source text for which the suggestions should be returned.',
      type: 'string',
    },
    terminate_after: {
      description:
        'The maximum number of documents to collect for each shard, upon reaching which the query execution will terminate early.',
      type: 'number',
    },
    timeout: {
      description: 'Explicit operation timeout.',
      type: 'string',
    },
    track_scores: {
      description: 'Whether to calculate and return scores even if they are not used for sorting.',
      type: 'boolean',
    },
    track_total_hits: {
      description:
        'Whether to count the hits that match the query accurately (true), not at all (false), or accurately up to a number. Defaults to 10000.',
      type: ['boolean', 'integer'],
    },
    typed_keys: {
      description:
        'Specify whether aggregation and suggester names should be prefixed by their respective types in the response.',
      type: 'boolean',
    },
    version: {
      description: 'Specify whether to return document version as part of a hit',
      type: 'boolean',
    },
    type: {
      not: {},
      errorMessage: 'was removed in Elasticsearch 8. Mapping types no longer exist',
    },
    _source_include: {
      not: {},
      errorMessage: 'is not supported by Elasticsearch 9. Use "_source_includes"',
    },
    _source_exclude: {
      not: {},
      errorMessage: 'is not supported by Elasticsearch 9. Use "_source_excludes"',
    },
    source: {
      not: {},
      errorMessage:
        'is not supported by Elasticsearch 9. Set the search definition as top level request properties, like "query" and "aggs"',
    },
    min_compatible_shard_node: {
      not: {},
      errorMessage: 'is not supported by Elasticsearch 9',
    },
  },
  definitions: {
    Query: {
      description:
        'A query expressed in the Elasticsearch query DSL. See https://www.elastic.co/docs/explore-analyze/query-filter/languages/querydsl.',
      type: 'object',
      additionalProperties: true,
    },
  },
  errorMessage: {
    type: 'ElasticsearchSearch request properties should be an object.',
  },
};
