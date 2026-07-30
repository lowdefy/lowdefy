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

const label = {
  type: 'string',
  description: 'Text shown for the shortcut - supports html.',
};

const dateDescription =
  'A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value. For dates relative to now, use the _dayjs operator, and start the chain with a utc step - steps that snap to a calendar boundary, like startOf and endOf, resolve in local time otherwise and can land on the wrong day, eg. "_dayjs: [now, utc, {startOf: month}]".';

const date = {
  type: ['string', 'number', 'object'],
  description: dateDescription,
};

export const datePresets = {
  type: 'array',
  description:
    'Shortcuts listed next to the calendar to quickly select a date. Presets are evaluated every time the block renders, so operator based values like "_date: now" stay current.',
  docs: {
    displayType: 'yaml',
  },
  items: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label,
      value: date,
    },
  },
};

export const dateRangePresets = {
  type: 'array',
  description:
    'Shortcuts listed next to the calendar to quickly select a date range. Presets are evaluated every time the block renders, so operator based values like "_date: now" stay current.',
  docs: {
    displayType: 'yaml',
  },
  items: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label,
      value: {
        // The docs table does not recurse into the items of a nested array, so the date description
        // is repeated here to keep it on the DateRangeSelector page.
        type: 'array',
        description: `The start and end date of the range. ${dateDescription}`,
        minItems: 2,
        maxItems: 2,
        items: date,
      },
    },
  },
};
