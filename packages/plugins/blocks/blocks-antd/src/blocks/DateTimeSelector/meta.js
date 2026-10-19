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
import { dateTimePresets } from '../../schemas/presets.js';
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
  showWeek,
} from '../../schemas/pickerProperties.js';
import pickerTheme from '../../schemas/pickerTheme.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'calendar', 'clear'],
  valueType: 'date',
  cssKeys: {
    element: 'The DateTimeSelector element.',
    label: 'The DateTimeSelector label.',
    extra: 'The DateTimeSelector extra content.',
    feedback: 'The DateTimeSelector validation feedback.',
    popup: 'The DateTimeSelector popup.',
    prefixIcon: 'The prefix icon in the DateTimeSelector.',
    suffixIcon: 'The suffix icon in the DateTimeSelector.',
  },
  events: {
    ...pickerEvents,
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected date-time value.' },
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
          'Format in which to parse the date value, eg. "DD MMMM YYYY HH:mm" will parse a date value of 1999-12-31T15:30 as "31 December 1999 15:30". The format has to conform to dayjs formats. Defaults to the active locale\'s date-time format, or "YYYY-MM-DD HH:mm" when no locale is configured.',
      },
      hourStep: {
        type: 'integer',
        default: 1,
        minimum: 1,
        description: 'Hour intervals to show in the time selector.',
      },
      inputReadOnly,
      label,
      minuteStep: {
        type: 'integer',
        default: 5,
        minimum: 1,
        description: 'Minute intervals to show in the time selector.',
      },
      needConfirm: {
        type: 'boolean',
        default: true,
        description:
          'Require the OK button to confirm the selection. When false, the popup has no OK button and the selection is saved when the popup closes, eg. when the user clicks outside it or presses Enter.',
      },
      placeholder: { ...placeholder },
      placement,
      prefix,
      prefixIcon,
      presets: dateTimePresets,
      secondStep: {
        type: 'integer',
        default: 30,
        minimum: 1,
        description: 'Second intervals to show in the time selector.',
      },
      selectUTC: {
        type: 'boolean',
        default: false,
        description: "Shows the user's selection as UTC time, not time-zone based.",
      },
      showToday: {
        type: 'boolean',
        default: true,
        description: 'Deprecated - use showNow. Used for showNow when showNow is not set.',
      },
      showNow: {
        type: 'boolean',
        default: true,
        description: "Shows a 'Now' button to set current time.",
      },
      showWeek,
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'calendar',
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on right-hand side of the date picker.',
      },
      timeFormat: {
        type: 'string',
        default: 'HH:mm',
        description:
          'Time format to show in the time selector. HH:mm:ss will show hours, minutes and seconds, HH:mm only hours and minutes and HH only hours. A 12 hour format like "hh:mm a" adds an AM/PM column; use a matching format, eg. "YYYY-MM-DD hh:mm a", to show the time in the input.',
      },
      title: inputTitle,
      theme: pickerTheme,
    },
  },
};
