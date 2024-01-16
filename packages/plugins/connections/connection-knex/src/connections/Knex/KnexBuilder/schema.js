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
  title: 'Lowdefy Request Schema - KnexBuilder',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'array',
      description:
        'SQL query builder array. An array of objects, with a single key which is the name of the knex builder function. The value should be an array of arguments to pass to the builder function.',
      errorMessage: {
        type: 'KnexBuilder request property "query" should be an array.',
      },
    },
    tableName: {
      type: ['string', 'object'],
      description: 'The name of the table to query from.',
      errorMessage: {
        type: 'KnexBuilder request property "tableName" should be a string or object',
      },
    },
  },
  errorMessage: {
    type: 'KnexBuilder request properties should be an object.',
    required: {
      query: 'KnexBuilder request should have required property "query".',
    },
  },
};
