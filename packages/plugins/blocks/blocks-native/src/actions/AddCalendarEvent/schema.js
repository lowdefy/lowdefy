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
    required: ['title', 'start'],
    properties: {
      title: {
        type: 'string',
        description: 'The event title.',
      },
      start: {
        type: 'string',
        description: 'Start, an ISO date-time.',
      },
      end: {
        type: 'string',
        description: 'End, an ISO date-time. An hour after start by default.',
      },
      allDay: {
        type: 'boolean',
        description: 'An all-day event.',
      },
      location: {
        type: 'string',
        description: 'Where.',
      },
      notes: {
        type: 'string',
        description: 'Notes.',
      },
      url: {
        type: 'string',
        description: 'A link.',
      },
    },
    additionalProperties: false,
  },
};
