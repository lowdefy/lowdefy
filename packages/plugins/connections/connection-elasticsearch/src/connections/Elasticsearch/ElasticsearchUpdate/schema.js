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
  title: 'Lowdefy Request Schema - ElasticsearchUpdate',
  type: 'object',
  description: 'Updates a document with a partial document or a script.',
  required: ['id'],
  anyOf: [
    {
      required: ['doc'],
    },
    {
      required: ['script'],
    },
  ],
  properties: {
    id: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
      description: 'Unique identifier for the document to be updated.',
    },
    index: {
      type: 'string',
      description:
        "Name of the target index. By default, the index is created automatically if it doesn't exist. For more information, see Automatically create data streams and indices.",
    },
    if_seq_no: {
      type: 'integer',
      description:
        'Only perform the operation if the document has this sequence number. See Optimistic concurrency control.',
    },
    if_primary_term: {
      type: 'integer',
      description:
        'Only perform the operation if the document has this primary term. See Optimistic concurrency control.',
    },
    require_alias: {
      type: 'boolean',
      description: 'If true, the destination must be an index alias. Defaults to false.',
      default: false,
    },
    refresh: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'boolean',
        },
      ],
      description:
        'If true, Elasticsearch refreshes the affected shards to make this operation visible to search, if wait_for then wait for a refresh to make this operation visible to search, if false do nothing with refreshes. Valid values: true, false, wait_for. Default: false.',
      enum: ['true', 'false', true, false, 'wait_for'],
      default: false,
    },
    retry_on_conflict: {
      type: 'integer',
      description:
        'Specify how many times should the operation be retried when a conflict occurs. Default: 0.',
      default: 0,
    },
    routing: {
      description: 'Custom value used to route operations to a specific shard.',
      type: 'string',
    },
    _source: {
      anyOf: [
        {
          type: 'boolean',
        },
        {
          type: 'array',
        },
        {
          type: 'object',
        },
      ],
      items: {
        type: 'string',
      },
      description:
        'Set to true to return the updated document in "response.get._source", or a list of the fields to return. Default: false.',
      default: false,
    },
    _source_excludes: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'Specify the source fields you want to exclude.',
    },
    _source_includes: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'Specify the source fields you want to include.',
    },
    timeout: {
      type: 'string',
      description:
        'Period to wait for the following operations:\n\nDynamic mapping updates\nWaiting for active shards\nDefaults to 1m (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.',
      default: '1m',
    },
    wait_for_active_shards: {
      type: 'string',
      description:
        'The number of shard copies that must be active before proceeding with the operation. Set to all or any positive integer up to the total number of shards in the index (number_of_replicas+1). Default: 1, the primary shard.',
      default: '1',
    },
    doc: {
      type: 'object',
      additionalProperties: true,
      description: 'A partial document to merge into the existing document.',
    },
    script: {
      $ref: '#/definitions/Script',
    },
    upsert: {
      type: 'object',
      additionalProperties: true,
      description:
        'The document to index if the document does not exist. If it exists, the script runs instead.',
    },
    doc_as_upsert: {
      type: 'boolean',
      description: 'If true, use the contents of "doc" as the upsert value. Defaults to false.',
      default: false,
    },
    scripted_upsert: {
      type: 'boolean',
      description: 'If true, run the script whether or not the document exists. Defaults to false.',
      default: false,
    },
    detect_noop: {
      type: 'boolean',
      description:
        'If true, the result in the response is "noop" when the document does not change. Defaults to true.',
      default: true,
    },
    lang: {
      type: 'string',
      description: 'The script language. Defaults to painless.',
      default: 'painless',
    },
    body: {
      not: {},
      errorMessage:
        'was removed in Lowdefy 8 (Elasticsearch client 9). Move the keys in "body" (like "doc" and "script") to the top level of the request properties',
    },
  },
  definitions: {
    Script: {
      description: 'An Elasticsearch script.',
      additionalProperties: false,
      anyOf: [
        {
          required: ['source'],
        },
        {
          required: ['id'],
        },
      ],
      properties: {
        lang: {
          type: 'string',
          enum: ['painless', 'expression', 'mustache', 'java'],
          description: 'Specifies the language the script is written in. Defaults to painless.',
          default: 'painless',
        },
        source: {
          description: 'The script itself, which you specify as source for an inline script.',
          type: 'string',
        },
        id: {
          description:
            'The script itself, which you specify as id for a stored script. Use the stored script APIs to create and manage stored scripts.',
          type: 'string',
        },
        params: {
          description:
            'Specifies any named parameters that are passed into the script as variables. Use parameters instead of hard-coded values to decrease compile time.',
          type: 'object',
        },
        options: {
          description: 'Options for the script language.',
          type: 'object',
        },
      },
      errorMessage: {
        anyOf:
          'ElasticsearchUpdate request should have required property "script.source" or "script.id".',
      },
    },
  },
  errorMessage: {
    type: 'ElasticsearchUpdate request properties should be an object.',
    anyOf: 'ElasticsearchUpdate request should have required property "doc" or "script".',
    required: {
      id: 'ElasticsearchUpdate request should have required property "id".',
    },
  },
};
