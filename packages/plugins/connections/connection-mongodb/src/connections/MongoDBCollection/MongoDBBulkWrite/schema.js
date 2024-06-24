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

import { type } from '@lowdefy/helpers';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBBulkWrite',
  type: 'object',
  required: ['operations'],
  errorMessage: {
    type: 'MongoDBBulkWrite request properties should be an object.',
    required: 'MongoDBBulkWrite request should have required property "operations".',
  },
  properties: {
    operations: {
      type: 'array',
      description: 'Array containing all the write operations for the execution.',
      errorMessage: {
        type: 'MongoDBBulkWrite request property "operations" should be an array.',
      },
      items: {
        type: 'object',
        errorMessage: {
          type: 'MongoDBBulkWrite request property "operations" should be an array of write operation objects.',
          additionalProperties: 'MongoDBBulkWrite operation should be a write operation.',
          maxProperties: 'MongoDBBulkWrite operation should be a write operation.',
        },
        additionalProperties: false,
        maxProperties: 1,
        properties: {
          insertOne: {
            type: 'object',
            required: ['document'],
            errorMessage: {
              type: 'insertOne operation should be an object.',
              required: 'insertOne operation should have required property "document".',
            },
            properties: {
              document: {
                type: 'object',
                description: 'The document to be inserted.',
                errorMessage: {
                  type: 'insertOne operation property "document" should be an object.',
                },
              },
            },
          },
          updateOne: {
            type: 'object',
            required: ['filter', 'update'],
            errorMessage: {
              type: 'updateOne operation should be an object.',
              required: {
                filter: 'updateOne operation should have required property "filter".',
                update: 'updateOne operation should have required property "update".',
              },
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the document to update.',
                errorMessage: {
                  type: 'updateOne operation property "filter" should be an object.',
                },
              },
              update: {
                type: ['object', 'array'],
                description: 'The update operations to be applied to the document.',
                errorMessage: {
                  type: 'updateOne operation property "update" should be an object or an array.',
                },
              },
              upsert: {
                type: 'boolean',
                description: 'Insert document if no match is found.',
                errorMessage: {
                  type: 'updateOne operation property "upsert" should be a boolean.',
                },
              },
              arrayFilters: {
                type: 'array',
                description: 'Array filters for the `$[<identifier>]` array update operator.',
                errorMessage: {
                  type: 'updateOne operation property "arrayFilters" should be an array.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'updateOne operation property "collation" should be an object.',
                },
              },
              hint: {
                type: ['object', 'string'],
                description: 'An optional hint for query optimization.',
                errorMessage: {
                  type: 'updateOne operation property "hint" should be an object or a string.',
                },
              },
            },
          },
          updateMany: {
            type: 'object',
            required: ['filter', 'update'],
            errorMessage: {
              type: 'updateMany operation should be an object.',
              required: {
                filter: 'updateMany operation should have required property "filter".',
                update: 'updateMany operation should have required property "update".',
              },
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the documents to update.',
                errorMessage: {
                  type: 'updateMany operation property "filter" should be an object.',
                },
              },
              update: {
                type: ['object', 'array'],
                description: 'The update operations to be applied to the document.',
                errorMessage: {
                  type: 'updateMany operation property "update" should be an object or an array.',
                },
              },
              upsert: {
                type: 'boolean',
                description: 'Insert document if no match is found.',
                errorMessage: {
                  type: 'updateMany operation property "upsert" should be a boolean.',
                },
              },
              arrayFilters: {
                type: 'array',
                description: 'Array filters for the `$[<identifier>]` array update operator.',
                errorMessage: {
                  type: 'updateMany operation property "arrayFilters" should be an array.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'updateMany operation property "collation" should be an object.',
                },
              },
              hint: {
                type: ['object', 'string'],
                description: 'An optional hint for query optimization.',
                errorMessage: {
                  type: 'updateMany operation property "hint" should be an object or a string.',
                },
              },
            },
          },
          deleteOne: {
            type: 'object',
            required: ['filter'],
            errorMessage: {
              type: 'deleteOne operation should be an object.',
              required: 'deleteOne operation should have required property "filter".',
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the document to update.',
                errorMessage: {
                  type: 'deleteOne operation property "filter" should be an object.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'deleteOne operation property "collation" should be an object.',
                },
              },
            },
          },
          deleteMany: {
            type: 'object',
            required: ['filter'],
            errorMessage: {
              type: 'deleteMany operation should be an object.',
              required: 'deleteMany operation should have required property "filter".',
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the documents to delete.',
                errorMessage: {
                  type: 'deleteMany operation property "filter" should be an object.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'deleteMany operation property "collation" should be an object.',
                },
              },
            },
          },
          replaceOne: {
            type: 'object',
            required: ['filter', 'replacement'],
            errorMessage: {
              type: 'replaceOne operation should be an object.',
              required: {
                filter: 'replaceOne operation should have required property "filter".',
                replacement: 'replaceOne operation should have required property "replacement".',
              },
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the documents to update.',
                errorMessage: {
                  type: 'replaceOne operation property "filter" should be an object.',
                },
              },
              replacement: {
                type: 'object',
                description: 'The document to be inserted.',
                errorMessage: {
                  type: 'replaceOne operation property "replacement" should be an object.',
                },
              },
              upsert: {
                type: 'boolean',
                description: 'Insert document if no match is found.',
                errorMessage: {
                  type: 'replaceOne operation property "upsert" should be a boolean.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'replaceOne operation property "collation" should be an object.',
                },
              },
              hint: {
                type: ['object', 'string'],
                description: 'An optional hint for query optimization.',
                errorMessage: {
                  type: 'replaceOne operation property "hint" should be an object or a string.',
                },
              },
            },
          },
        },
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBBulkWrite request property "options" should be an object.',
      },
    },
  },
};
