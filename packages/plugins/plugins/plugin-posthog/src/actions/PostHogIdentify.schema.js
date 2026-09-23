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
      id: {
        type: ['string', 'null'],
        description:
          "The person's id. A missing, null or empty id does nothing, so the anonymous session on a public page is left alone.",
      },
      properties: {
        type: 'object',
        description:
          'Person properties to set. Null and undefined values are dropped, so an absent value never overwrites one PostHog already has.',
      },
      propertiesOnce: {
        type: 'object',
        description:
          'Person properties that are only set the first time, for example a signup date.',
      },
    },
    additionalProperties: false,
  },
};
