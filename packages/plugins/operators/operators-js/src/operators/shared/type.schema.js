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
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        enum: [
          'string',
          'array',
          'date',
          'object',
          'boolean',
          'number',
          'integer',
          'null',
          'undefined',
          'none',
          'primitive',
        ],
        description: 'Type name to test against state value at current location.',
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: [
              'string',
              'array',
              'date',
              'object',
              'boolean',
              'number',
              'integer',
              'null',
              'undefined',
              'none',
              'primitive',
            ],
            description: 'Type name to test.',
          },
          on: {
            description: 'Value to test the type of.',
          },
          key: {
            type: 'string',
            description: 'State key to test the type of.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
