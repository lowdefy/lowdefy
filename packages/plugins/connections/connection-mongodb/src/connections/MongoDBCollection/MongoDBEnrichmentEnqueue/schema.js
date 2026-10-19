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

const requestType = 'MongoDBEnrichmentEnqueue';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBEnrichmentEnqueue',
  type: 'object',
  required: ['columns', 'columnDefs', 'fields'],
  properties: {
    ...getEnrichmentSchemaProperties(requestType),
    columns: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
      description: 'The keys of the enrichment or ai columns to run.',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "columns" should be an array of column keys.',
        minItems:
          'MongoDBEnrichmentEnqueue request property "columns" should have at least one key.',
      },
    },
    selection: {
      type: ['array', 'object', 'null'],
      description:
        'The rows to run: an array of row keys, or the Table selected value { all: true, except, filter, search }, compiled against "fields". Leave it out to run every row inside "filter".',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "selection" should be an array or an object.',
      },
    },
    mode: {
      type: 'string',
      enum: ['all', 'empty', 'errors', 'stale'],
      default: 'all',
      description:
        'Which cells to queue: "all" (every cell that is not queued or running), "empty" (never run, or no result), "errors" (failed) or "stale" (the inputs changed since the value was computed).',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "mode" should be a string.',
        enum: 'MongoDBEnrichmentEnqueue request property "mode" should be "all", "empty", "errors" or "stale".',
      },
    },
    maxCells: {
      type: 'integer',
      minimum: 1,
      maximum: 1000000,
      default: 10000,
      description:
        'The most cells one enqueue may write (queued and missing input cells). A larger run writes nothing and throws.',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "maxCells" should be an integer.',
        minimum: 'MongoDBEnrichmentEnqueue request property "maxCells" should be at least 1.',
        maximum: 'MongoDBEnrichmentEnqueue request property "maxCells" should be at most 1000000.',
      },
    },
    maxTimeMS: {
      type: 'integer',
      minimum: 1,
      maximum: 600000,
      default: 30000,
      description: 'The time limit of each read, in milliseconds.',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "maxTimeMS" should be an integer.',
        minimum: 'MongoDBEnrichmentEnqueue request property "maxTimeMS" should be at least 1.',
        maximum: 'MongoDBEnrichmentEnqueue request property "maxTimeMS" should be at most 600000.',
      },
    },
    runId: {
      type: 'string',
      description:
        'The id the queued cells get as runId, 1 to 64 letters, digits, "_" or "-". Generated when left out.',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "runId" should be a string.',
      },
    },
    user: {
      type: ['object', 'null'],
      description:
        'The user that { $user: path } values in a selection filter resolve from. Set it to { _user: true }.',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "user" should be an object.',
      },
    },
    timezone: {
      type: 'string',
      description:
        'The IANA time zone whose days the date filters of a selection compare, as for MongoDBTableQuery. Defaults to UTC.',
      errorMessage: {
        type: 'MongoDBEnrichmentEnqueue request property "timezone" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBEnrichmentEnqueue request properties should be an object.',
    required: {
      columns: 'MongoDBEnrichmentEnqueue request should have required property "columns".',
      columnDefs: 'MongoDBEnrichmentEnqueue request should have required property "columnDefs".',
      fields: 'MongoDBEnrichmentEnqueue request should have required property "fields".',
    },
  },
};
