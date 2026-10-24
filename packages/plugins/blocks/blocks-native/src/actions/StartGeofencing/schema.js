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
    required: ['regions'],
    properties: {
      regions: {
        type: 'array',
        description: 'The regions to watch.',
        items: {
          type: 'object',
          required: ['id', 'latitude', 'longitude', 'radius'],
          properties: {
            id: {
              type: 'string',
              description: 'The region id.',
            },
            latitude: {
              type: 'number',
              description: 'Centre latitude.',
            },
            longitude: {
              type: 'number',
              description: 'Centre longitude.',
            },
            radius: {
              type: 'number',
              description: 'Radius in metres (at least 100 is reliable).',
            },
          },
          additionalProperties: false,
        },
        maxItems: 20,
      },
      endpointId: {
        type: 'string',
        description: 'The API endpoint enter and exit are posted to.',
      },
    },
    additionalProperties: false,
  },
};
