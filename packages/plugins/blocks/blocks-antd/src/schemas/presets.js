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
  `Shortcuts listed next to the calendar to quickly select ${selects}. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current.`;

const utcDateDescription = ({ example, unit }) =>
  `A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same ${unit} in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "${example}". Without the format step the chain resolves to an instant, which can select the ${unit} before or after the current one, depending on the browser timezone and the time of day.`;

const utcDate = ({ example, unit }) => ({
  type: ['string', 'number', 'object'],
  description: utcDateDescription({ example, unit }),
});

export const datePresets = ({ example, selects, unit }) => ({
  type: 'array',
  description: presetsDescription(selects),
  docs: {
    displayType: 'yaml',
  },
  items: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label,
      value: utcDate({ example, unit }),
    },
  },
});

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
        description:
          'A date string, a timestamp, or a _date object. The date is used as the instant it names, so "_date: now" and _dayjs chains need no special handling. With selectUTC the instant is shown on the UTC clock, so a chain that snaps to a calendar boundary needs a utc step to snap to the UTC day, eg. "_dayjs: [now, utc, {startOf: day}]". Without selectUTC the instant is shown on the local clock, so a chain resolves in local time, eg. "_dayjs: [now, {startOf: day}]".',
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
        description: `The start and end date of the range. ${utcDateDescription({
          example: '_dayjs: [now, {subtract: [7, days]}, {format: YYYY-MM-DD}]',
          unit: 'day',
        })}`,
        minItems: 2,
        maxItems: 2,
        items: utcDate({
          example: '_dayjs: [now, {subtract: [7, days]}, {format: YYYY-MM-DD}]',
          unit: 'day',
        }),
      },
    },
  },
};
