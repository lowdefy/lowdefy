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
  inputTitle,
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
    element: 'The WeekSelector element.',
    label: 'The WeekSelector label.',
    extra: 'The WeekSelector extra content.',
    feedback: 'The WeekSelector validation feedback.',
    popup: 'The WeekSelector popup.',
    prefixIcon: 'The prefix icon in the WeekSelector.',
    suffixIcon: 'The suffix icon in the WeekSelector.',
  },
  events: {
    ...pickerEvents,
    onChange: {
      description: 'Trigger action when week is changed.',
      event: { value: 'The selected week value.' },
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
        default: 'YYYY-wo',
        description:
          'Format in which to format the date value, eg. "wo-YYYY" will format a date value of 1999-12-26 as "52nd-1999". The format has to conform to dayjs formats.',
      },
      inputReadOnly,
      placeholder: { ...placeholder },
      placement,
      prefix,
      prefixIcon,
      presets: datePresets({
        example: '_dayjs: [now, {startOf: week}, {format: YYYY-MM-DD}]',
        selects: 'a week',
        unit: 'week',
      }),
      label,
      showToday: {
        type: 'boolean',
        default: true,
        description:
          'Deprecated - has no effect. The week picker has no button to select the current date.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'calendar',
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon at the right-hand side of the date picker.',
      },
      title: inputTitle,
      theme: pickerTheme,
    },
  },
};
