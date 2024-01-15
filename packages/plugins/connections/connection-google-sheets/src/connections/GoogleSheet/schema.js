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
  title: 'Lowdefy Connection Schema - GoogleSheet',
  type: 'object',
  required: ['spreadsheetId'],
  properties: {
    apiKey: {
      type: 'string',
      description: 'API key for your google project.',
      errorMessage: {
        type: 'GoogleSheet connection property "apiKey" should be a string.',
      },
    },
    client_email: {
      type: 'string',
      description: 'The email of your service account.',
      errorMessage: {
        type: 'GoogleSheet connection property "client_email" should be a string.',
      },
    },
    private_key: {
      type: 'string',
      description: 'The private key for your service account.',
      errorMessage: {
        type: 'GoogleSheet connection property "private_key" should be a string.',
      },
    },
    sheetId: {
      type: 'string',
      description:
        'The ID of the worksheet. Can be found in the URL as the "gid" parameter. One of "sheetId" or "sheetIndex" is required.',
      errorMessage: {
        type: 'GoogleSheet connection property "sheetId" should be a string.',
      },
    },
    sheetIndex: {
      type: 'number',
      description:
        'The position of the worksheet as they appear in the Google sheets UI. Starts from 0. One of "sheetId" or "sheetIndex" is required.',
      errorMessage: {
        type: 'GoogleSheet connection property "sheetIndex" should be a number.',
      },
    },
    spreadsheetId: {
      type: 'string',
      description: 'document ID from the URL of the spreadsheet.',
      errorMessage: {
        type: 'GoogleSheet connection property "spreadsheetId" should be a string.',
      },
    },
    columnTypes: {
      type: 'object',
      description: 'Define types for columns in the spreadsheet.',
      patternProperties: {
        '^.*$': {
          type: 'string',
          enum: ['string', 'number', 'boolean', 'date', 'json'],
          errorMessage: {
            enum: 'GoogleSheet connection property "{{ instancePath }}" should be one of "string", "number", "boolean", "date", or "json".',
          },
        },
      },
      errorMessage: {
        type: 'GoogleSheet connection property "columnTypes" should be an object.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the spreadsheet.',
      errorMessage: {
        type: 'GoogleSheet connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the spreadsheet.',
      errorMessage: {
        type: 'GoogleSheet connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheet connection properties should be an object.',
    required: {
      spreadsheetId: 'GoogleSheet connection should have required property "spreadsheetId".',
    },
  },
};
