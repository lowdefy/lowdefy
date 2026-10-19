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
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        description: 'The feature flag key.',
      },
      default: {
        description:
          'Returned when the flag has no value for this person, and when PostHog is not initialised or is disabled. Defaults to null.',
      },
      enabled: {
        type: 'boolean',
        description:
          'Return a boolean, using isFeatureEnabled, instead of the variant value. Ignored when payload is true.',
      },
      payload: {
        type: 'boolean',
        description:
          'Return the flag payload, using getFeatureFlagPayload, instead of the flag value. Takes precedence over enabled.',
      },
    },
    additionalProperties: false,
  },
};
