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
    required: ['event'],
    properties: {
      event: {
        type: 'string',
        minLength: 1,
        description: 'The event name, for example report_submitted.',
      },
      properties: {
        type: 'object',
        description: 'Event properties. Never include personally identifiable information.',
      },
      groups: {
        type: 'object',
        description:
          'Groups to attach to this one event, as { groupType: groupKey }. Sent to PostHog as the $groups property.',
        additionalProperties: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
};
