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

import fieldTypes from './fieldTypes.js';

const fieldTypeNames = Object.keys(fieldTypes);

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBTableQuery',
  type: 'object',
  required: ['fields'],
  properties: {
    pipeline: {
      type: 'array',
      description:
        'Base aggregation stages that always run first, for example tenant or permission scoping and a $project of the returned fields. The view can only narrow what this pipeline returns.',
      items: {
        type: 'object',
      },
      errorMessage: {
        type: 'MongoDBTableQuery request property "pipeline" should be an array of stages.',
      },
    },
    fields: {
      type: 'object',
      description:
        'The allowlist of fields the view may sort, filter, search, group and aggregate by, keyed by column key.',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        required: ['type'],
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: fieldTypeNames,
            description: 'The column type. It decides the allowed filter operators and aggregates.',
          },
          path: {
            type: 'string',
            description: 'Dot path of the value in the documents. Defaults to the field key.',
          },
          search: {
            type: 'boolean',
            default: false,
            description: 'Include the field in the view search.',
          },
          sortable: {
            type: 'boolean',
            default: true,
            description: 'Allow sorting by the field.',
          },
          filterable: {
            type: 'boolean',
            default: true,
            description: 'Allow filtering by the field.',
          },
          groupable: {
            type: 'boolean',
            default: false,
            description: 'Allow grouping by the field.',
          },
        },
        errorMessage: {
          type: 'MongoDBTableQuery request "fields" values should be objects.',
          required: 'MongoDBTableQuery request field should have required property "type".',
          additionalProperties:
            'MongoDBTableQuery request field should only have "type", "path", "search", "sortable", "filterable" and "groupable".',
        },
      },
      errorMessage: {
        type: 'MongoDBTableQuery request property "fields" should be an object.',
        minProperties:
          'MongoDBTableQuery request property "fields" should have at least one field.',
      },
    },
    view: {
      type: ['object', 'null'],
      description:
        'The Table view ({ sort, filter, search, group, aggregates }), usually { _payload: view }. Validated against "fields".',
      errorMessage: {
        type: 'MongoDBTableQuery request property "view" should be an object.',
      },
    },
    startRow: {
      type: ['integer', 'null'],
      default: 0,
      description: 'Index of the first row to return, usually { _payload: startRow }.',
      errorMessage: {
        type: 'MongoDBTableQuery request property "startRow" should be an integer.',
      },
    },
    endRow: {
      type: ['integer', 'null'],
      description:
        'Index after the last row to return, usually { _payload: endRow }. Defaults to startRow + maxRows.',
      errorMessage: {
        type: 'MongoDBTableQuery request property "endRow" should be an integer.',
      },
    },
    groupPath: {
      type: ['array', 'null'],
      description:
        'Group key values of the expanded group, one per view group level, usually { _payload: groupPath }.',
      errorMessage: {
        type: 'MongoDBTableQuery request property "groupPath" should be an array.',
      },
    },
    maxRows: {
      type: 'integer',
      minimum: 1,
      default: 1000,
      description: 'The most rows (or groups) one request may return.',
      errorMessage: {
        type: 'MongoDBTableQuery request property "maxRows" should be an integer.',
        minimum: 'MongoDBTableQuery request property "maxRows" should be at least 1.',
      },
    },
    user: {
      type: ['object', 'null'],
      description:
        'The requesting user, used to resolve { $user: path } filter values. Set it to { _user: true }, which is evaluated on the server from the session.',
      errorMessage: {
        type: 'MongoDBTableQuery request property "user" should be an object.',
      },
    },
    options: {
      type: 'object',
      description:
        'Optional aggregate settings, for example collation, maxTimeMS, allowDiskUse or hint.',
      errorMessage: {
        type: 'MongoDBTableQuery request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBTableQuery request properties should be an object.',
    required: {
      fields: 'MongoDBTableQuery request should have required property "fields".',
    },
  },
};
