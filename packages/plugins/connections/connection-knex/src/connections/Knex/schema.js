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
  title: 'Lowdefy Connection Schema - Knex',
  type: 'object',
  required: ['client', 'connection'],
  properties: {
    client: {
      type: 'string',
      description: 'SQL query string.',
      errorMessage: {
        type: 'Knex connection property "client" should be a string.',
      },
    },
    connection: {
      type: ['string', 'object'],
      description: 'SQL query string.',
      errorMessage: {
        type: 'Knex connection property "connection" should be a string or object.',
      },
    },
    searchPath: {
      type: 'string',
      description: 'Set PostgreSQL search path.',
      errorMessage: {
        type: 'Knex connection property "searchPath" should be a string.',
      },
    },
    version: {
      type: 'string',
      description: 'Set database version.',
      errorMessage: {
        type: 'Knex connection property "version" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'Knex connection properties should be an object.',
    required: {
      client: 'Knex connection should have required property "client".',
      connection: 'Knex connection should have required property "connection".',
    },
  },
};
