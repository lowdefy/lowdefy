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
  title: 'Lowdefy Request Schema - ElasticsearchUpdate',
  type: 'object',
  description: 'Updates a document using the specified script.',
  required: ['id', 'body'],
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
      ],
      items: {
        type: 'string',
      },
      description:
        'Set to false to disable source retrieval (default: true). You can also specify a comma-separated list of the fields you want to retrieve.',
      default: true,
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
    body: {
      description: 'The request definition requires either script or partial doc.',
      anyOf: [
        {
          required: ['doc'],
        },
        {
          required: ['script'],
        },
      ],
      properties: {
        doc: {
          additionalProperties: true,
          description: 'Partial document to update',
        },
        script: {
          $ref: '#/definitions/Script',
        },
      },
      errorMessage: {
        anyOf:
          'ElasticsearchUpdate request should have required property "body.doc" or "body.script".',
      },
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
      },
      errorMessage: {
        anyOf:
          'ElasticsearchUpdate request should have required property "body.script.source" or "body.script.id".',
      },
    },
  },
  errorMessage: {
    type: 'ElasticsearchUpdate request properties should be an object.',
    required: {
      id: 'ElasticsearchUpdate request should have required property "id".',
      body: 'ElasticsearchUpdate request should have required property "body".',
    },
  },
};
