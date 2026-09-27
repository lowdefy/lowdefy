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
import { dateRangePresets } from '../../schemas/presets.js';
import {
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
  valueType: 'array',
  cssKeys: {
    element: 'The DateRangeSelector element.',
    label: 'The DateRangeSelector label.',
    extra: 'The DateRangeSelector extra content.',
    feedback: 'The DateRangeSelector validation feedback.',
    popup: 'The DateRangeSelector popup.',
    prefixIcon: 'The prefix icon in the DateRangeSelector.',
    suffixIcon: 'The suffix icon in the DateRangeSelector.',
  },
  events: {
    ...pickerEvents,
    onBlur: {
      description: 'Trigger actions when the picker loses focus.',
      event: { range: 'The input that lost focus, "start" or "end".' },
    },
    onFocus: {
      description: 'Trigger actions when the picker gets focus.',
      event: { range: 'The input that got focus, "start" or "end".' },
    },
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected date range value.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: { ...allowClear, default: true },
      allowEmpty: {
        type: 'array',
        items: { type: 'boolean' },
        minItems: 2,
        maxItems: 2,
        default: [false, false],
        description:
          'Allow the start or the end date to be left empty, for an open-ended range. An empty date is null in the block value.',
        docs: {
          displayType: 'yaml',
        },
      },
      autoFocus,
      bordered: {
        type: 'boolean',
        default: true,
        description:
          "Deprecated - use variant: 'borderless'. Whether or not the input has a border style.",
      },
      disabled: {
        oneOf: [
          {
            type: 'boolean',
            default: false,
            description: 'Disable the block if true.',
          },
          {
            type: 'array',
            description:
              'Disable only the start or the end input, eg. [true, false] to fix the start date.',
            items: { type: 'boolean' },
            minItems: 2,
            maxItems: 2,
          },
        ],
        description:
          'Disable the block if true. An array of two booleans disables only the start or the end input, eg. [true, false] to fix the start date. A disabled input needs a value, or allowEmpty for that input.',
      },
      variant: pickerVariant,
      disabledDates,
      format: {
        type: 'string',
        description:
          'Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats. Defaults to the active locale\'s date format, or "YYYY-MM-DD" when no locale is configured.',
      },
      inputReadOnly,
      label,
      placeholder: {
        type: 'array',
        description:
          'Placeholder text inside the block before user types input. When unset, antd uses the localized default from ConfigProvider locale.',
        docs: {
          displayType: 'manual',
          block: {
            id: 'block_properties_placeholder',
            layout: {
              _global: 'settings_input_layout',
            },
            type: 'Label',
            properties: {
              title: 'placeholder',
              span: 8,
              align: 'right',
              extra: 'Placeholder text inside the block before user types input.',
            },
            blocks: [
              {
                id: 'block.properties.placeholder.0',
                layout: {
                  span: 12,
                },
                type: 'TextInput',
                properties: {
                  size: 'small',
                  label: {
                    disabled: true,
                  },
                },
              },
              {
                id: 'block.properties.placeholder.1',
                layout: {
                  span: 12,
                },
                type: 'TextInput',
                properties: {
                  size: 'small',
                  label: {
                    disabled: true,
                  },
                },
              },
            ],
          },
        },
      },
      placement,
      prefix,
      prefixIcon,
      presets: dateRangePresets,
      separator: {
        type: 'string',
        default: '~',
        description: 'Separator symbol shown between start and end date inputs.',
      },
      showWeek,
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'calendar',
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on right-hand side of the date picker.',
      },
      title: inputTitle,
      theme: pickerTheme,
    },
  },
};
