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
import {
  disabled,
  placeholder,
  inputTitle,
  autoFocus,
  allowClear,
  sizeSmallDefaultLarge,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'AiOutlineCalendar'],
  valueType: 'date',
  cssKeys: {
    element: 'The DateTimeSelector element.',
    label: 'The DateTimeSelector label.',
    extra: 'The DateTimeSelector extra content.',
    feedback: 'The DateTimeSelector validation feedback.',
    popup: 'The DateTimeSelector popup.',
    suffixIcon: 'The suffix icon in the DateTimeSelector.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected date-time value.' },
    },
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
      variant: {
        type: 'string',
        enum: ['outlined', 'filled', 'borderless'],
        default: 'outlined',
        description: "Variant style of the input. Use 'borderless' instead of bordered: false.",
      },
      disabledDates,
      format: {
        type: 'string',
        default: 'YYYY-MM-DD HH:mm',
        description:
          'Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats.',
      },
      hourStep: {
        type: 'integer',
        default: 1,
        minimum: 1,
        description: 'Hour intervals to show in the time selector.',
      },
      label,
      minuteStep: {
        type: 'integer',
        default: 5,
        minimum: 1,
        description: 'Minute intervals to show in the time selector.',
      },
      placeholder: { ...placeholder, default: 'Select Date & Time' },
      secondStep: {
        type: 'integer',
        default: 5,
        minimum: 1,
        description: 'Minute intervals to show in the time selector.',
      },
      selectUTC: {
        type: 'boolean',
        default: false,
        description: "Shows the user's selection as UTC time, not time-zone based.",
      },
      showToday: {
        type: 'boolean',
        default: true,
        description: 'Shows a button to easily select the current date if true.',
      },
      showNow: {
        type: 'boolean',
        default: true,
        description: "Shows a 'Now' button to set current time.",
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'AiOutlineCalendar',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on right-hand side of the date picker.",
      },
      timeFormat: {
        type: 'string',
        default: 'HH:mm',
        description:
          'Time format to show in the time selector. HH:mm:ss will show hours, minutes and seconds, HH:mm only hours and minutes and HH only hours.',
      },
      title: inputTitle,
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/date-picker#design-token',
        },
        properties: {
          cellHeight: {
            type: 'number',
            default: 24,
            description: 'Height of a calendar cell.',
          },
          cellWidth: {
            type: 'number',
            default: 36,
            description: 'Width of a calendar cell.',
          },
          cellHoverBg: {
            type: 'string',
            description: 'Background color of a calendar cell on hover.',
          },
          cellActiveWithRangeBg: {
            type: 'string',
            description: 'Background color of cells within the selected range.',
          },
          cellHoverWithRangeBg: {
            type: 'string',
            description: 'Background color of cells within range on hover.',
          },
          cellBgDisabled: {
            type: 'string',
            description: 'Background color of disabled cells.',
          },
          cellRangeBorderColor: {
            type: 'string',
            description: 'Border color of range selection cells.',
          },
          timeColumnWidth: {
            type: 'number',
            default: 56,
            description: 'Width of the time panel column.',
          },
          timeColumnHeight: {
            type: 'number',
            default: 224,
            description: 'Height of the time panel column.',
          },
          timeCellHeight: {
            type: 'number',
            default: 28,
            description: 'Height of a time cell in the time panel.',
          },
          addonBg: {
            type: 'string',
            description: 'Background color for the addon area.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color on hover.',
          },
          activeBorderColor: {
            type: 'string',
            description: 'Border color when active.',
          },
          activeShadow: {
            type: 'string',
            description: 'Shadow effect when active.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding of the input.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for small size.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for large size.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding of the input.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for small size.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for large size.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the picker popup.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the input.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the input.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large size.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small size.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the input.',
          },
          colorText: {
            type: 'string',
            description: 'Text color.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Placeholder text color.',
          },
        },
      },
    },
  },
};
