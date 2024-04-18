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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBFindOne',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'object',
      description: 'A MongoDB query object',
      errorMessage: {
        type: 'MongoDBFindOne request property "query" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBFindOne request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBFindOne request properties should be an object.',
    required: 'MongoDBFindOne request should have required property "query".',
  },
};
