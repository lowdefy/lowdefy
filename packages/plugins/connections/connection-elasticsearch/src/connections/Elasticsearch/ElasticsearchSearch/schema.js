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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - ElasticsearchSearch',
  type: 'object',
  properties: {
    body: {
      type: 'object',
      description: 'The search definition using the Query DSL.',
      properties: {
        query: {
          $ref: '#/definitions/Query',
        },
        aggs: {
          description: 'The aggregations to request for the search.',
          type: 'object',
        },
      },
    },
    _source: {
      description:
        'True or false to return the _source field or not, or a list of fields to return.',
      examples: [['id', 'name'], 'name', true, false],
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
        {
          type: 'boolean',
        },
      ],
    },
    _source_exclude: {
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
    _source_include: {
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
    min_compatible_shard_node: {
      description:
        'The minimum compatible version that all shards involved in search should have for this request to be successful.',
      type: 'string',
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
      description: 'A comma-separated list of <field>:<direction> pairs.',
      examples: ['name:asc', ['rating:asc', 'created_at:desc']],
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
    source: {
      description:
        'The URL-encoded request definition. Useful for libraries that do not accept a request body for non-POST requests.',
      type: 'string',
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
      description: 'Indicate if the number of documents that match the query should be tracked.',
      type: 'boolean',
    },
    type: {
      description:
        'A comma-separated list of document types to search; leave empty to perform the operation on all types.',
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
    typed_keys: {
      description:
        'Specify whether aggregation and suggester names should be prefixed by their respective types in the response.',
      type: 'boolean',
    },
    version: {
      description: 'Specify whether to return document version as part of a hit',
      type: 'boolean',
    },
  },
  definitions: {
    Query: {
      description:
        'A query expressed in the Elasticsearch query DSL. See https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html.',
      type: 'object',
      additionalProperties: true,
    },
  },
  errorMessage: {
    type: 'ElasticsearchSearch request properties should be an object.',
  },
};
