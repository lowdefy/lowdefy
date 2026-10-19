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
  title: 'Lowdefy Request Schema - TregCatalogSearch',
  type: 'object',
  required: ['q'],
  properties: {
    q: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
      description:
        'What you want to do, in words, such as "find a work email". Matched against the catalog by task words.',
      errorMessage: {
        type: 'TregCatalogSearch request property "q" should be a string.',
        minLength: 'TregCatalogSearch request property "q" should not be empty.',
        maxLength: 'TregCatalogSearch request property "q" should be at most 500 characters.',
      },
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      description: 'The most results to return, 1 to 100. treg defaults to 25.',
      errorMessage: {
        type: 'TregCatalogSearch request property "limit" should be an integer.',
        minimum: 'TregCatalogSearch request property "limit" should be at least 1.',
        maximum: 'TregCatalogSearch request property "limit" should be at most 100.',
      },
    },
  },
  additionalProperties: false,
  errorMessage: {
    type: 'TregCatalogSearch request properties should be an object.',
    required: {
      q: 'TregCatalogSearch request should have required property "q".',
    },
    additionalProperties: 'TregCatalogSearch request should only have "q" and "limit".',
  },
};
