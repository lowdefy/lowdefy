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
  title: 'Lowdefy Request Schema - KnexRaw',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string',
      description: 'SQL query string.',
      errorMessage: {
        type: 'KnexRaw request property "query" should be a string.',
      },
    },
    parameters: {
      type: ['string', 'number', 'array', 'object'],
      description: 'SQL query parameters.',
      errorMessage: {
        type: 'KnexRaw request property "parameters" should be a string, number, array, or object.',
      },
    },
  },
  errorMessage: {
    type: 'KnexRaw request properties should be an object.',
    required: {
      query: 'KnexRaw request should have required property "query".',
    },
  },
};
