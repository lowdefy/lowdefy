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
    required: ['title'],
    properties: {
      id: {
        type: 'string',
        description: 'An id, to cancel or replace it later. A new one is made when left out.',
      },
      title: {
        type: 'string',
        description: 'The title.',
      },
      body: {
        type: 'string',
        description: 'The text.',
      },
      data: {
        type: 'object',
        description:
          'Data handed to onNotification and onNotificationAction. data.path opens that page on tap.',
      },
      path: {
        type: 'string',
        description: 'The page path a tap opens. Same as data.path.',
      },
      categoryId: {
        type: 'string',
        description: 'A mobile.notifications category, for its action buttons.',
      },
      badge: {
        type: 'number',
        description: 'The app icon badge to set when it shows.',
      },
      at: {
        type: 'string',
        description: 'When to show it, as an ISO date-time.',
      },
      seconds: {
        type: 'number',
        description: 'Show it this many seconds from now.',
      },
      repeats: {
        type: 'boolean',
        description: 'Repeat every `seconds` (at least 60).',
        default: false,
      },
    },
    additionalProperties: false,
  },
};
