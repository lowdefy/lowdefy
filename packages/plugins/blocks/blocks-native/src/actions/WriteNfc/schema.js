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
    type: 'object',
    required: ['records'],
    properties: {
      records: {
        type: 'array',
        description: 'The records to write.',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'text or uri.',
              enum: ['text', 'uri'],
            },
            value: {
              type: 'string',
              description: 'The text or URI.',
            },
            language: {
              type: 'string',
              description: 'The language of a text record.',
              default: 'en',
            },
          },
          required: ['type', 'value'],
          additionalProperties: false,
        },
      },
      prompt: {
        type: 'string',
        description: 'Text in the iOS scan sheet.',
      },
    },
    additionalProperties: false,
  },
};
