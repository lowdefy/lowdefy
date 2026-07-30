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

const presetsDescription = (selects) =>
  `Shortcuts listed next to the calendar to quickly select ${selects}. Presets are evaluated every time the block renders, so operator based values like "_date: now" stay current. A preset that resolves to a date excluded by disabledDates does nothing when it is clicked.`;

const utcDateDescription =
  'A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value. For dates relative to now, use the _dayjs operator, and start the chain with a utc step - steps that snap to a calendar boundary, like startOf and endOf, resolve in local time otherwise and can land on the wrong day, eg. "_dayjs: [now, utc, {startOf: month}]".';

const dateTimeDescription =
  'A date string, a timestamp, or a _date object. With selectUTC the date is read as UTC, the same as the block value, so a _dayjs chain that snaps to a calendar boundary, like startOf or endOf, needs a utc step first, eg. "_dayjs: [now, utc, {startOf: day}]". Without selectUTC the date is read as the instant it names and shown on the local clock, so a _dayjs chain resolves in local time, eg. "_dayjs: [now, {startOf: day}]".';

const utcDate = {
  type: ['string', 'number', 'object'],
  description: utcDateDescription,
};

export const datePresets = {
  type: 'array',
  description: presetsDescription('a date'),
  docs: {
    displayType: 'yaml',
  },
  items: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label,
      value: utcDate,
    },
  },
};

export const dateTimePresets = {
  type: 'array',
  description: presetsDescription('a date and time'),
  docs: {
    displayType: 'yaml',
  },
  items: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label,
      value: {
        type: ['string', 'number', 'object'],
        description: dateTimeDescription,
      },
    },
  },
};

export const dateRangePresets = {
  type: 'array',
  description: presetsDescription('a date range'),
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
        description: `The start and end date of the range. ${utcDateDescription}`,
        minItems: 2,
        maxItems: 2,
        items: utcDate,
      },
    },
  },
};
