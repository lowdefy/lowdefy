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

const requestType = 'MongoDBEnrichmentClaim';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBEnrichmentClaim',
  type: 'object',
  required: ['columnDefs', 'fields'],
  properties: {
    ...getEnrichmentSchemaProperties(requestType),
    columns: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
      description:
        'Claim only cells of these enrichment or ai columns. Defaults to every enrichment and ai column of "columnDefs".',
      errorMessage: {
        type: 'MongoDBEnrichmentClaim request property "columns" should be an array of column keys.',
        minItems: 'MongoDBEnrichmentClaim request property "columns" should have at least one key.',
      },
    },
    providers: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Claim only cells of columns that use these providers, for a worker per provider.',
      errorMessage: {
        type: 'MongoDBEnrichmentClaim request property "providers" should be an array of provider ids.',
      },
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 200,
      default: 20,
      description: 'The most cells one claim returns.',
      errorMessage: {
        type: 'MongoDBEnrichmentClaim request property "limit" should be an integer.',
        minimum: 'MongoDBEnrichmentClaim request property "limit" should be at least 1.',
        maximum: 'MongoDBEnrichmentClaim request property "limit" should be at most 200.',
      },
    },
    leaseMs: {
      type: 'integer',
      minimum: 1000,
      maximum: 3600000,
      default: 120000,
      description:
        'How long a claimed cell stays with its worker, in milliseconds. After it, the cell can be claimed again.',
      errorMessage: {
        type: 'MongoDBEnrichmentClaim request property "leaseMs" should be an integer.',
        minimum: 'MongoDBEnrichmentClaim request property "leaseMs" should be at least 1000.',
        maximum: 'MongoDBEnrichmentClaim request property "leaseMs" should be at most 3600000.',
      },
    },
    maxAttempts: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 3,
      description:
        'A cell whose lease ran out on this attempt becomes an error instead of being claimed again. Use the same value as MongoDBEnrichmentComplete.',
      errorMessage: {
        type: 'MongoDBEnrichmentClaim request property "maxAttempts" should be an integer.',
        minimum: 'MongoDBEnrichmentClaim request property "maxAttempts" should be at least 1.',
        maximum: 'MongoDBEnrichmentClaim request property "maxAttempts" should be at most 100.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBEnrichmentClaim request properties should be an object.',
    required: {
      columnDefs: 'MongoDBEnrichmentClaim request should have required property "columnDefs".',
      fields: 'MongoDBEnrichmentClaim request should have required property "fields".',
    },
  },
};
