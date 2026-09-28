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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBTableChanges',
  type: 'object',
  required: ['changes', 'fields'],
  properties: {
    changes: {
      type: 'object',
      description:
        'The TableInput value to save, { updated, added, removed, moved, order }, usually { _payload: changes }. Validated against "fields".',
      errorMessage: {
        type: 'MongoDBTableChanges request property "changes" should be an object.',
      },
    },
    fields: {
      type: 'object',
      description:
        'The allowlist of fields the changes may write, keyed by the TableInput column field (its dot path). Nothing outside it is written.',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        required: ['type'],
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: fieldTypeNames,
            description: 'The column type. Values are checked and coerced to it.',
          },
          path: {
            type: 'string',
            description:
              'Dot path the value is written to, in the document (or the array item in array mode). Defaults to the field key.',
          },
        },
        errorMessage: {
          type: 'MongoDBTableChanges request "fields" values should be objects.',
          required: 'MongoDBTableChanges request field should have required property "type".',
          additionalProperties:
            'MongoDBTableChanges request field should only have "type" and "path".',
        },
      },
      errorMessage: {
        type: 'MongoDBTableChanges request property "fields" should be an object.',
        minProperties:
          'MongoDBTableChanges request property "fields" should have at least one field.',
      },
    },
    filter: {
      type: 'object',
      description:
        'The base filter every operation is scoped by, for example tenant or ownership. Required unless the connection is tenant-scoped; set it to {} to allow writes to every document.',
      errorMessage: {
        type: 'MongoDBTableChanges request property "filter" should be an object.',
      },
    },
    rowKeyField: {
      type: 'string',
      default: '_id',
      description:
        'The document field a row key matches, in collection mode. New rows without a key get a generated ObjectId when it is "_id".',
      errorMessage: {
        type: 'MongoDBTableChanges request property "rowKeyField" should be a string.',
      },
    },
    rowKeyType: {
      type: 'string',
      enum: ['auto', 'objectId', 'string', 'number'],
      default: 'auto',
      description:
        'How row keys are read. "auto" keeps strings and numbers and reads ObjectIds (the Table keys them as {"_oid":"..."} text); "objectId" also reads 24 character hex strings; "number" reads numeric strings, which numeric keys become in "updated" and "moved".',
      errorMessage: {
        type: 'MongoDBTableChanges request property "rowKeyType" should be a string.',
        enum: 'MongoDBTableChanges request property "rowKeyType" should be "auto", "objectId", "string" or "number".',
      },
    },
    array: {
      type: 'object',
      description:
        'Array mode: the rows are the items of an embedded array in one document. Field paths and positionField are then paths in the item.',
      required: ['documentId', 'path'],
      additionalProperties: false,
      properties: {
        documentId: {
          description:
            'The _id of the document that holds the array. Use { _oid: <hex> } for an ObjectId from a string.',
        },
        path: {
          type: 'string',
          description: 'Dot path of the array in the document.',
        },
        itemKeyField: {
          type: 'string',
          default: '_id',
          description:
            'The item field a row key matches. New items without a key get a generated ObjectId when it is "_id".',
        },
      },
      errorMessage: {
        type: 'MongoDBTableChanges request property "array" should be an object.',
        required:
          'MongoDBTableChanges request property "array" should have "documentId" and "path".',
        additionalProperties:
          'MongoDBTableChanges request property "array" should only have "documentId", "path" and "itemKeyField".',
      },
    },
    positionField: {
      type: 'string',
      description:
        'Dot path of the numeric position field (TableInput rowDrag.positionField). Needed to save "moved", and to save "order" in collection mode.',
      errorMessage: {
        type: 'MongoDBTableChanges request property "positionField" should be a string.',
      },
    },
    insertDefaults: {
      type: 'object',
      description:
        'Values every added row starts with, for example { org_id: { _user: organization.id } } or a created date. The row values set over them.',
      errorMessage: {
        type: 'MongoDBTableChanges request property "insertDefaults" should be an object.',
      },
    },
    ordered: {
      type: 'boolean',
      default: true,
      description:
        'Run the operations in order and stop at the first error. With false (collection mode only), MongoDB runs them all and reports every error.',
      errorMessage: {
        type: 'MongoDBTableChanges request property "ordered" should be a boolean.',
      },
    },
    maxChanges: {
      type: 'integer',
      minimum: 1,
      default: 1000,
      description:
        'The most row changes one request may apply: updated, added, removed and moved rows plus order entries.',
      errorMessage: {
        type: 'MongoDBTableChanges request property "maxChanges" should be an integer.',
        minimum: 'MongoDBTableChanges request property "maxChanges" should be at least 1.',
      },
    },
    options: {
      type: 'object',
      description:
        'Optional bulkWrite settings, for example writeConcern, bypassDocumentValidation or comment.',
      errorMessage: {
        type: 'MongoDBTableChanges request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBTableChanges request properties should be an object.',
    required: {
      changes: 'MongoDBTableChanges request should have required property "changes".',
      fields: 'MongoDBTableChanges request should have required property "fields".',
    },
  },
};
