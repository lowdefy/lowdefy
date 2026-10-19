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

import fieldTypes from '../MongoDBTableQuery/fieldTypes.js';

const fieldTypeNames = Object.keys(fieldTypes);

// The request properties the three enrichment requests share, with error messages that name
// the request.
function getEnrichmentSchemaProperties(requestType) {
  return {
    columnDefs: {
      type: 'array',
      minItems: 1,
      description:
        'The table columns, declared and user-defined merged (a Table columns list can be passed as it is). Enrichment and ai columns are { key, kind, provider, inputs: { [param]: { column, required? } | { value } }, prompt?, autoRun? }; other columns are only looked up by key.',
      items: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: 'The column key.' },
          kind: {
            type: 'string',
            enum: ['input', 'formula', 'enrichment', 'ai', 'extract'],
            description: 'The column kind. Only enrichment and ai columns run.',
          },
          provider: {
            type: 'string',
            description:
              'Enrichment and ai columns: the provider id, which the worker maps to its endpoint. Defaults to "ai" for ai columns.',
          },
          inputs: {
            type: 'object',
            description:
              'Enrichment and ai columns: { [param]: { column, required? } | { value } }. A column input reads a "fields" field or another enrichment column\'s value.',
          },
          prompt: { type: 'string', description: 'Ai columns: the prompt template.' },
          autoRun: {
            type: 'boolean',
            description:
              'Enrichment and ai columns: run when an input column completes (MongoDBEnrichmentComplete queues it, and names it in downstream).',
          },
        },
        errorMessage: {
          type: `${requestType} request "columnDefs" items should be objects.`,
          required: `${requestType} request "columnDefs" items should have required property "key".`,
        },
      },
      errorMessage: {
        type: `${requestType} request property "columnDefs" should be an array.`,
        minItems: `${requestType} request property "columnDefs" should have at least one column.`,
      },
    },
    fields: {
      type: 'object',
      minProperties: 1,
      description:
        'The MongoDBTableQuery fields of the table, keyed by column key: the allowlist of fields that column inputs read, that a select-all selection is compiled against and that claimed rows return.',
      additionalProperties: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: fieldTypeNames },
          path: { type: 'string' },
        },
        errorMessage: {
          type: `${requestType} request "fields" values should be objects.`,
          required: `${requestType} request field should have required property "type".`,
        },
      },
      errorMessage: {
        type: `${requestType} request property "fields" should be an object.`,
        minProperties: `${requestType} request property "fields" should have at least one field.`,
      },
    },
    filter: {
      type: 'object',
      description:
        'The base filter every read and write is scoped by, for example { org_id: { _user: organization.id } }. Required unless the connection is tenant-scoped; set it to {} to run on every document. It may not name "_enrich".',
      errorMessage: {
        type: `${requestType} request property "filter" should be an object.`,
      },
    },
    rowKeyField: {
      type: 'string',
      default: '_id',
      description: 'The document field a row key matches.',
      errorMessage: {
        type: `${requestType} request property "rowKeyField" should be a string.`,
      },
    },
    rowKeyType: {
      type: 'string',
      enum: ['auto', 'objectId', 'string', 'number'],
      default: 'auto',
      description: 'How row keys are read, as for MongoDBTableChanges.',
      errorMessage: {
        type: `${requestType} request property "rowKeyType" should be a string.`,
        enum: `${requestType} request property "rowKeyType" should be "auto", "objectId", "string" or "number".`,
      },
    },
  };
}

export default getEnrichmentSchemaProperties;
