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
  title: 'Lowdefy Request Schema - MongoDBCreateIndexes',
  type: 'object',
  required: ['indexes'],
  properties: {
    indexes: {
      type: 'array',
      minItems: 1,
      description:
        'The indexes to create, written exactly as the collections.<name>.indexes entries they mirror: [{ keys, options }].',
      items: {
        type: 'object',
        required: ['keys'],
        properties: {
          keys: {
            type: 'object',
            description:
              'The index key specification, for example { organization_id: 1, due: -1 }.',
            errorMessage: {
              type: 'MongoDBCreateIndexes request property "indexes[].keys" should be an object.',
            },
          },
          options: {
            type: 'object',
            description:
              'MongoDB createIndexes options for this index, for example { unique: true, name: "by_org_due" }.',
            errorMessage: {
              type: 'MongoDBCreateIndexes request property "indexes[].options" should be an object.',
            },
          },
        },
        errorMessage: {
          type: 'MongoDBCreateIndexes request property "indexes" should be an array of objects.',
          required:
            'MongoDBCreateIndexes request property "indexes" entries should have required property "keys".',
        },
      },
      errorMessage: {
        type: 'MongoDBCreateIndexes request property "indexes" should be an array.',
        minItems: 'MongoDBCreateIndexes request property "indexes" should not be empty.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBCreateIndexes request properties should be an object.',
    required: 'MongoDBCreateIndexes request should have required property "indexes".',
  },
};
