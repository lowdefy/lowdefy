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
  title: 'Lowdefy Request Schema - GoogleSheetGetMany',
  type: 'object',
  properties: {
    filter: {
      type: 'object',
      description: 'A MongoDB query expression to filter the data.',
      errorMessage: {
        type: 'GoogleSheetGetMany request property "filter" should be an object.',
      },
    },
    pipeline: {
      type: 'array',
      description: 'A MongoDB aggregation pipeline to transform the data.',
      errorMessage: {
        type: 'GoogleSheetGetMany request property "pipeline" should be an array.',
      },
    },
    options: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The maximum number of rows to fetch.',
          errorMessage: {
            type: 'GoogleSheetGetMany request property "options.limit" should be a number.',
          },
        },
        skip: {
          type: 'number',
          description: 'The number of rows to skip from the top of the sheet.',
          errorMessage: {
            type: 'GoogleSheetGetMany request property "options.skip" should be a number.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetGetMany request properties should be an object.',
  },
};
