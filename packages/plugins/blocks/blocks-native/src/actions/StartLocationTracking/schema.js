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
    required: ['endpointId'],
    properties: {
      endpointId: {
        type: 'string',
        description: 'The API endpoint points are posted to.',
      },
      accuracy: {
        type: 'string',
        description: 'How exact the points are; better costs battery.',
        enum: ['low', 'balanced', 'high', 'navigation'],
        default: 'balanced',
      },
      distanceInterval: {
        type: 'number',
        description: 'Metres between points.',
        default: 50,
      },
      timeInterval: {
        type: 'number',
        description: 'Seconds between points (Android).',
        default: 60,
      },
      notificationTitle: {
        type: 'string',
        description: 'Android: the title of the notification shown while tracking.',
      },
      notificationBody: {
        type: 'string',
        description: 'Android: the text of the notification shown while tracking.',
      },
    },
    additionalProperties: false,
  },
};
