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
  title: 'Lowdefy Request Schema - ElasticsearchDelete',
  type: 'object',
  description: 'Removes a JSON document from the specified index.',
  required: ['id'],
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
      description: 'Unique identifier for the document.',
    },
    index: {
      type: 'string',
      description: 'The name of the index.',
    },
    if_seq_no: {
      type: 'integer',
      description:
        'Only perform the delete operation if the last operation that has changed the document has the specified sequence number.',
    },
    if_primary_term: {
      type: 'integer',
      description:
        'Only perform the delete operation if the last operation that has changed the document has the specified primary term.',
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
    routing: {
      description: 'Custom value used to route operations to a specific shard.',
      type: 'string',
    },
    timeout: {
      type: 'string',
      description: 'Period to wait for active shards. Defaults to 1m (one minute).',
      default: '1m',
    },
    version: {
      description:
        'Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.',
      type: 'integer',
    },
    version_type: {
      type: 'string',
      description: 'Specific version type.',
      enum: ['internal', 'external', 'external_gte', 'force'],
    },
    wait_for_active_shards: {
      type: 'string',
      description:
        'The number of shard copies that must be active before proceeding with the operation. Set to all or any positive integer up to the total number of shards in the index (number_of_replicas+1). Default: 1, the primary shard.',
      default: '1',
    },
  },
  errorMessage: {
    type: 'ElasticsearchDelete request properties should be an object.',
    required: {
      id: 'ElasticsearchDelete request should have required property "id".',
    },
  },
};
