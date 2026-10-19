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
  title: 'Lowdefy Connection Schema - MongoDBCollection',
  type: 'object',
  required: ['databaseUri', 'collection'],
  properties: {
    databaseUri: {
      type: 'string',
      description: 'Connection uri string for the MongoDb deployment.',
      errorMessage: {
        type: 'MongoDBCollection connection property "databaseUri" should be a string.',
      },
    },
    databaseName: {
      type: 'string',
      description: 'Database name.',
      errorMessage: {
        type: 'MongoDBCollection connection property "databaseName" should be a string.',
      },
    },
    collection: {
      type: 'string',
      description: 'Collection name.',
      errorMessage: {
        type: 'MongoDBCollection connection property "collection" should be a string.',
      },
    },
    changeLog: {
      type: 'object',
      required: ['collection'],
      description: 'Log all changes made by write requests to a log collection.',
      properties: {
        collection: {
          type: 'string',
          description: 'Name of the collection change log records are written to.',
          errorMessage: {
            type: 'MongoDBCollection connection property "changeLog.collection" should be a string.',
          },
        },
        meta: {
          type: 'object',
          description: 'Additional data to include in every change log record.',
          errorMessage: {
            type: 'MongoDBCollection connection property "changeLog.meta" should be an object.',
          },
        },
      },
      errorMessage: {
        type: 'MongoDBCollection connection property "changeLog" should be an object.',
        required: {
          collection:
            'MongoDBCollection connection property "changeLog" should have required property "collection".',
        },
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the collection.',
      errorMessage: {
        type: 'MongoDBCollection connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the collection.',
      errorMessage: {
        type: 'MongoDBCollection connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBCollection connection properties should be an object.',
    required: {
      databaseUri: 'MongoDBCollection connection should have required property "databaseUri".',
      collection: 'MongoDBCollection connection should have required property "collection".',
    },
  },
};
