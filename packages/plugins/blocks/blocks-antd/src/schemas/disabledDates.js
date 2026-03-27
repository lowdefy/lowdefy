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
  description: 'Disable specific dates so that they can not be chosen.',
  properties: {
    min: {
      type: ['string', 'object'],
      description:
        'Disable all dates less than the minimum date. Can be a date string or a _date object.',
      docs: {
        displayType: 'date',
      },
    },
    max: {
      type: ['string', 'object'],
      description:
        'Disable all dates greater than the maximum date. Can be a date string or a _date object.',
      docs: {
        displayType: 'date',
      },
    },
    dates: {
      type: 'array',
      description: 'Array of specific dates to disable.',
      items: {
        type: ['string', 'object'],
        description: 'A date string or _date object to disable.',
        docs: {
          displayType: 'date',
        },
      },
    },
    ranges: {
      type: 'array',
      description: 'Array of date ranges to disable.',
      items: {
        type: 'object',
        properties: {
          from: {
            type: ['string', 'object'],
            description: 'Start of the disabled range.',
            docs: {
              displayType: 'date',
            },
          },
          to: {
            type: ['string', 'object'],
            description: 'End of the disabled range.',
            docs: {
              displayType: 'date',
            },
          },
        },
      },
    },
  },
};
