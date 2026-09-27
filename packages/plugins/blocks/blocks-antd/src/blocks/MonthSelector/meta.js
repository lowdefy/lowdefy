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

import LabelMeta from '../Label/meta.js';
import label from '../../schemas/label.js';
import icon from '../../schemas/icon.js';
import disabledDates from '../../schemas/disabledDates.js';
import { datePresets } from '../../schemas/presets.js';
import {
  disabled,
  placeholder,
  autoFocus,
  allowClear,
  sizeSmallDefaultLarge,
} from '../../schemas/inputProperties.js';
import {
  inputReadOnly,
  pickerEvents,
  pickerVariant,
  placement,
  prefix,
  prefixIcon,
} from '../../schemas/pickerProperties.js';
import pickerTheme from '../../schemas/pickerTheme.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'calendar', 'clear'],
  valueType: 'date',
  cssKeys: {
    element: 'The MonthSelector element.',
    label: 'The MonthSelector label.',
    extra: 'The MonthSelector extra content.',
    feedback: 'The MonthSelector validation feedback.',
    popup: 'The MonthSelector popup.',
    prefixIcon: 'The prefix icon in the MonthSelector.',
    suffixIcon: 'The suffix icon in the MonthSelector.',
  },
  events: {
    ...pickerEvents,
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected month value.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: { ...allowClear, default: true },
      autoFocus,
      bordered: {
        type: 'boolean',
        default: true,
        description:
          "Deprecated - use variant: 'borderless'. Whether or not the input has a border style.",
      },
      disabled,
      variant: pickerVariant,
      disabledDates,
      format: {
        type: 'string',
        description:
          'Format in which to format the date value, eg. "MMMM YYYY" will format a date value of 1999-12-31 as "December 1999". The format has to conform to dayjs formats. Defaults to the active locale\'s month format, or "YYYY-MM" when no locale is configured.',
      },
      inputReadOnly,
      placeholder: { ...placeholder },
      placement,
      prefix,
      prefixIcon,
      presets: datePresets({
        example: '_dayjs: [now, {startOf: month}, {format: YYYY-MM-DD}]',
        selects: 'a month',
        unit: 'month',
      }),
      showToday: {
        type: 'boolean',
        default: true,
        description:
          'Deprecated - has no effect. The month picker has no button to select the current date.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'calendar',
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on right-hand side of the date picker.',
      },
      label,
      title: {
        type: 'string',
        description: 'Month selector label title - supports html.',
      },
      theme: pickerTheme,
    },
  },
};
