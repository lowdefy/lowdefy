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
  title: 'Lowdefy Request Schema - GoogleSheetUpdateOne',
  type: 'object',
  required: ['update', 'filter'],
  properties: {
    filter: {
      type: 'object',
      description:
        'A MongoDB query expression to filter the data. The first row matched by the filter will be updated.',
      errorMessage: {
        type: 'GoogleSheetUpdateOne request property "filter" should be an object.',
      },
    },
    update: {
      type: 'object',
      description:
        'The update to apply to the row. An object where keys are the column names and values are the updated values.',
      errorMessage: {
        type: 'GoogleSheetUpdateOne request property "update" should be an object.',
      },
    },
    options: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The maximum number of rows to fetch.',
          errorMessage: {
            type: 'GoogleSheetUpdateOne request property "options.limit" should be a number.',
          },
        },
        raw: {
          type: 'boolean',
          description: 'Store raw values instead of converting as if typed into the sheets UI.',
          errorMessage: {
            type: 'GoogleSheetUpdateOne request property "options.raw" should be a boolean.',
          },
        },
        skip: {
          type: 'number',
          description: 'The number of rows to skip from the top of the sheet.',
          errorMessage: {
            type: 'GoogleSheetUpdateOne request property "options.skip" should be a number.',
          },
        },
        upsert: {
          type: 'boolean',
          description: 'Insert the row if no rows are matched by the filter.',
          errorMessage: {
            type: 'GoogleSheetUpdateOne request property "options.upsert" should be a boolean.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetUpdateOne request properties should be an object.',
    required: {
      filter: 'GoogleSheetUpdateOne request should have required property "filter".',
      update: 'GoogleSheetUpdateOne request should have required property "update".',
    },
  },
};
