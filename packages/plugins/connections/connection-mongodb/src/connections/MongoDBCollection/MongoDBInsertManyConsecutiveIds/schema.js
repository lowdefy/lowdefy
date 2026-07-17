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
  title: 'Lowdefy Request Schema - MongoDBInsertManyConsecutiveIds',
  type: 'object',
  required: ['docs', 'prefix'],
  properties: {
    docs: {
      type: 'array',
      description: 'The documents to be inserted.',
      items: {
        type: 'object',
        errorMessage: {
          type: 'MongoDBInsertManyConsecutiveIds request property "docs" should be an array of objects.',
        },
      },
      errorMessage: {
        type: 'MongoDBInsertManyConsecutiveIds request property "docs" should be an array.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBInsertManyConsecutiveIds request property "options" should be an object.',
      },
    },
    prefix: {
      type: 'string',
      description: 'Prefix to add to _id.',
      errorMessage: {
        type: 'MongoDBInsertManyConsecutiveIds request property "prefix" should be a string.',
      },
    },
    length: {
      type: 'number',
      description: 'The numeric ID will be padded to this number of digits.',
      errorMessage: {
        type: 'MongoDBInsertManyConsecutiveIds request property "length" should be a number.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBInsertManyConsecutiveIds request properties should be an object.',
    required: {
      docs: 'MongoDBInsertManyConsecutiveIds request should have required property "docs".',
      prefix: 'MongoDBInsertManyConsecutiveIds request should have required property "prefix".',
    },
  },
};
