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
      mediaTypes: {
        type: 'array',
        items: { type: 'string', enum: ['images', 'videos'] },
        default: ['images'],
        description: 'What the picker offers: photos, videos or both.',
      },
      multiple: { type: 'boolean', default: false, description: 'Allow picking several.' },
      maxCount: { type: 'number', description: 'The most that can be picked at once.' },
      quality: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.7,
        description: 'JPEG quality of photos, 0 to 1.',
      },
      base64: {
        type: 'boolean',
        default: false,
        description: 'Return each photo content as base64 too.',
      },
      upload: {
        type: 'object',
        required: ['endpointId'],
        description:
          'Upload each file to an API endpoint, called with { ...payload, file: { name, mimeType, size, base64 } }. Each file comes back with the endpoint answer as "upload".',
        properties: {
          endpointId: { type: 'string', description: 'The API endpoint to call.' },
          payload: { type: 'object', description: 'Extra payload sent with each file.' },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};
