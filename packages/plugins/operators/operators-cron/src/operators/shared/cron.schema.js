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
    oneOf: [
      {
        type: 'string',
        description:
          'The cron expression to operate on. Shorthand for { "expression": <value> }, used by all _cron methods.',
      },
      {
        type: 'null',
        description:
          'A missing cron expression. Only _cron.describe (returns "") and _cron.validate (returns false) accept this.',
      },
      {
        type: 'object',
        required: ['expression'],
        properties: {
          expression: {
            type: ['string', 'null'],
            description:
              'The cron expression, like "0 9 * * 1". Used by all _cron methods. When this is null or a blank string, _cron.describe returns "" and _cron.validate returns false.',
          },
          from: {
            type: ['string', 'object'],
            description:
              'Only for _cron.next and _cron.previous. The date to count occurrences from, exclusive, as a date or an ISO 8601 date string like "2024-01-01" or "2024-01-01T09:00:00Z". Defaults to the current time.',
          },
          timezone: {
            type: 'string',
            description:
              'Only for _cron.next and _cron.previous. IANA timezone name, like "Europe/London", the cron expression is evaluated in. Defaults to the timezone of the environment evaluating the operator.',
          },
          count: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            description:
              'Only for _cron.next and _cron.previous. The number of occurrences to return, from 1 to 1000. A count of 1 returns a single date, a count greater than 1 returns an array of dates. Defaults to 1.',
          },
          locale: {
            type: 'string',
            description:
              'Only for _cron.describe. The cronstrue locale code to describe the expression in, like "fr" or "pt_BR" ("pt-BR" is also accepted). An error is thrown for an unsupported locale. Defaults to "en".',
          },
          verbose: {
            type: 'boolean',
            description:
              'Only for _cron.describe. Describe the expression in a more verbose sentence. Defaults to false.',
          },
          use24HourTimeFormat: {
            type: 'boolean',
            description:
              'Only for _cron.describe. Describe times in the 24 hour format. Defaults to the format of the locale.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
