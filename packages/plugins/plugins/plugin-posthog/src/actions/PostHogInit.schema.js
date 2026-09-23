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
      apiKey: {
        type: ['string', 'null'],
        description:
          'The PostHog project API key. A public, write only key that is meant to ship in the browser bundle - never a personal API key. Required unless enabled is false.',
      },
      apiHost: {
        type: 'string',
        minLength: 1,
        description:
          'The PostHog ingestion host. Defaults to https://us.i.posthog.com. Use https://eu.i.posthog.com for the EU cloud, or the host of a self hosted instance.',
      },
      options: {
        type: 'object',
        description:
          'Passed through to posthog.init as its config object, for example capture_pageview, person_profiles, autocapture, persistence or opt_out_capturing_by_default.',
      },
      debug: {
        type: 'boolean',
        description: 'Log everything PostHog does to the browser console.',
      },
      enabled: {
        type: 'boolean',
        description:
          'Set to false to skip loading posthog-js. Every other PostHog action then does nothing. Defaults to true.',
      },
    },
    if: {
      not: {
        properties: { enabled: { const: false } },
        required: ['enabled'],
      },
    },
    then: {
      required: ['apiKey'],
      properties: {
        apiKey: { type: 'string', minLength: 1 },
      },
    },
    additionalProperties: false,
  },
};
