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
  title: 'Lowdefy Request Schema - GoogleSheetAppendMany',
  type: 'object',
  required: ['rows'],
  properties: {
    rows: {
      type: 'array',
      description:
        'The rows to insert into the sheet. An an array of objects where keys are the column names and values are the values to insert.',
      errorMessage: {
        type: 'GoogleSheetAppendMany request property "rows" should be an array.',
      },
      items: {
        type: 'object',
        description:
          'The row to insert into the sheet. An object where keys are the column names and values are the values to insert.',
        errorMessage: {
          type: 'GoogleSheetAppendMany request property "rows" should be an array of objects.',
        },
      },
    },
    options: {
      type: 'object',
      properties: {
        raw: {
          type: 'boolean',
          description: 'Store raw values instead of converting as if typed into the sheets UI.',
          errorMessage: {
            type: 'GoogleSheetAppendMany request property "options.raw" should be a boolean.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetAppendMany request properties should be an object.',
    required: {
      rows: 'GoogleSheetAppendMany request should have required property "rows".',
    },
  },
};
