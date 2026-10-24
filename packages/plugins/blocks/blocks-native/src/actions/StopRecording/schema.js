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
    properties: {
      base64: {
        type: 'boolean',
        description: 'Return the recording as base64 too.',
        default: false,
      },
      upload: {
        type: 'object',
        required: ['endpointId'],
        description:
          'Upload the file to an API endpoint, called with { ...payload, file: { name, mimeType, size, base64 } }.',
        properties: {
          endpointId: {
            type: 'string',
            description: 'The API endpoint to call.',
          },
          payload: {
            type: 'object',
            description: 'Extra payload sent with the file.',
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};
