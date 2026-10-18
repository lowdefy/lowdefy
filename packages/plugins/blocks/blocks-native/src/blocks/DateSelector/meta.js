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

import label from '../../schemas/inputLabel.js';
import {
  allowClear,
  autoFocus,
  bordered,
  disabled,
  inputTitle,
  placeholder,
  sizeSmallDefaultLarge,
  theme,
  variant,
  webIcon,
} from '../../schemas/inputProperties.js';

const bound = {
  type: ['string', 'object'],
  docs: { displayType: 'date' },
};

export default {
  category: 'input',
  icons: [],
  valueType: 'date',
  cssKeys: {
    element: 'The DateSelector field.',
    label: 'The DateSelector label.',
    extra: 'The DateSelector extra content.',
    feedback: 'The DateSelector validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when a date is picked or cleared.',
      event: { value: 'The picked day at midnight UTC, or null when cleared.' },
    },
    onClear: 'Trigger actions when the date is cleared.',
    onOpenChange: {
      description: 'Trigger actions when the date picker opens or closes.',
      event: { open: 'Whether the date picker is open.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: { ...allowClear, default: true },
      autoFocus,
      bordered,
      disabled,
      disabledDates: {
        type: 'object',
        additionalProperties: false,
        description:
          'The earliest and latest days that can be picked. A native date picker takes only these bounds, so the web\'s "dates" and "ranges" are not supported on mobile.',
        properties: {
          min: {
            ...bound,
            description: 'The earliest day that can be picked. A date string or a _date object.',
          },
          max: {
            ...bound,
            description: 'The latest day that can be picked. A date string or a _date object.',
          },
        },
      },
      format: {
        type: 'string',
        description:
          'The dayjs format the date is shown in. Defaults to the active locale\'s date format, or "YYYY-MM-DD" when no locale is configured.',
      },
      label,
      placeholder: { ...placeholder, default: 'Select date' },
      showToday: {
        type: 'boolean',
        default: true,
        nativeIgnored: true,
        description: 'Ignored on mobile: the platform picker marks today.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: webIcon,
      theme,
      title: inputTitle,
      variant,
    },
  },
};
