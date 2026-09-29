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

import getEnrichmentSchemaProperties from '../enrichment/getEnrichmentSchemaProperties.js';

const requestType = 'MongoDBEnrichmentComplete';
const { columnDefs, filter, rowKeyField, rowKeyType } = getEnrichmentSchemaProperties(requestType);

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBEnrichmentComplete',
  type: 'object',
  required: ['results', 'columnDefs'],
  properties: {
    columnDefs,
    filter,
    rowKeyField,
    rowKeyType,
    results: {
      type: 'array',
      maxItems: 1000,
      description:
        'The results of claimed cells: [{ rowKey, columnKey, claimToken, status: ok | error | empty, value?, raw?, cost?, error?, retry? }], with rowKey, columnKey and claimToken as MongoDBEnrichmentClaim returned them.',
      items: {
        type: 'object',
        required: ['rowKey', 'columnKey', 'claimToken', 'status'],
        properties: {
          rowKey: { description: 'The row key of the claim.' },
          columnKey: { type: 'string', description: 'The column key of the claim.' },
          claimToken: { type: 'string', description: 'The claimToken of the claim.' },
          status: {
            type: 'string',
            enum: ['ok', 'error', 'empty'],
            description: 'ok with a value, empty for no result, or error.',
          },
          cost: {
            type: ['integer', 'null'],
            minimum: 0,
            description:
              'What the provider call behind this result cost, in micro-USD (such as TregCall cost.micro). Stored as the cell cost; null is the same as not given.',
          },
          value: { description: 'The extracted result the column shows.' },
          raw: {
            description:
              'The provider response, for the details panel and "Add as column". Larger than rawMaxBytes, it is stored as a truncation marker.',
          },
          error: { type: 'string', description: 'The error message, with status error.' },
          retry: {
            type: 'boolean',
            default: true,
            description: 'With status error: false makes the error final, with no retry.',
          },
        },
        additionalProperties: false,
        errorMessage: {
          type: 'MongoDBEnrichmentComplete request "results" items should be objects.',
          required:
            'MongoDBEnrichmentComplete request "results" items should have "rowKey", "columnKey", "claimToken" and "status".',
          additionalProperties:
            'MongoDBEnrichmentComplete request "results" items should only have "rowKey", "columnKey", "claimToken", "status", "value", "raw", "cost", "error" and "retry".',
        },
      },
      errorMessage: {
        type: 'MongoDBEnrichmentComplete request property "results" should be an array.',
        maxItems:
          'MongoDBEnrichmentComplete request property "results" should have at most 1000 results.',
      },
    },
    maxAttempts: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 3,
      description:
        'The attempts a cell gets. An error on an earlier attempt is queued again; on this one it is final.',
      errorMessage: {
        type: 'MongoDBEnrichmentComplete request property "maxAttempts" should be an integer.',
        minimum: 'MongoDBEnrichmentComplete request property "maxAttempts" should be at least 1.',
        maximum: 'MongoDBEnrichmentComplete request property "maxAttempts" should be at most 100.',
      },
    },
    backoffMs: {
      type: 'integer',
      minimum: 0,
      maximum: 86400000,
      default: 30000,
      description:
        'The wait before a failed cell is claimed again, doubled per attempt made: backoffMs * 2^(attempt - 1), at most a day.',
      errorMessage: {
        type: 'MongoDBEnrichmentComplete request property "backoffMs" should be an integer.',
        minimum: 'MongoDBEnrichmentComplete request property "backoffMs" should be at least 0.',
        maximum:
          'MongoDBEnrichmentComplete request property "backoffMs" should be at most 86400000.',
      },
    },
    rawMaxBytes: {
      type: 'integer',
      minimum: 1024,
      maximum: 8388608,
      default: 65536,
      description:
        'The largest raw response (BSON bytes) stored as it is. A larger raw is stored as { _truncated: true, bytes, maxBytes, preview }, and a larger value makes the result an error.',
      errorMessage: {
        type: 'MongoDBEnrichmentComplete request property "rawMaxBytes" should be an integer.',
        minimum:
          'MongoDBEnrichmentComplete request property "rawMaxBytes" should be at least 1024.',
        maximum:
          'MongoDBEnrichmentComplete request property "rawMaxBytes" should be at most 8388608.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBEnrichmentComplete request properties should be an object.',
    required: {
      results: 'MongoDBEnrichmentComplete request should have required property "results".',
      columnDefs: 'MongoDBEnrichmentComplete request should have required property "columnDefs".',
    },
  },
};
