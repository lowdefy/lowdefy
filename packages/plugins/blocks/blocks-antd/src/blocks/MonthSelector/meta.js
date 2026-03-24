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
  autoFocus,
  allowClear,
  sizeSmallDefaultLarge,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'AiOutlineCalendar'],
  valueType: 'date',
  cssKeys: {
    element: 'The MonthSelector element.',
    label: 'The MonthSelector label.',
    extra: 'The MonthSelector extra content.',
    feedback: 'The MonthSelector validation feedback.',
    popup: 'The MonthSelector popup.',
    suffixIcon: 'The suffix icon in the MonthSelector.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected month value.' },
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
        default: 'YYYY-MM',
        description:
          'Format in which to format the date value, eg. "MMMM YYYY" will format a date value of 1999-12-31 as "December 1999". The format has to conform to dayjs formats.',
      },
      placeholder: { ...placeholder, default: 'Select Month' },
      showToday: {
        type: 'boolean',
        default: true,
        description: 'Shows a button to easily select the current date if true.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'AiOutlineCalendar',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on right-hand side of the date picker.",
      },
      label,
      title: {
        type: 'string',
        description: 'Month selector label title - supports html.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/date-picker#design-token',
        },
        properties: {
          activeBorderColor: {
            type: 'string',
            description: 'Border color when the picker is active/focused.',
          },
          activeShadow: {
            type: 'string',
            description: 'Shadow effect when the picker is active/focused.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when hovering over the picker.',
          },
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
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background color of a calendar cell on hover.',
          },
          cellActiveWithRangeBg: {
            type: 'string',
            default: '#e6f4ff',
            description: 'Background color of active cell within a range selection.',
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
          addonBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color of the footer addon area.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the picker popup layer.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding for the default size picker.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for the small size picker.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for the large size picker.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the default size picker.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for the small size picker.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the large size picker.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the picker input.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for the small picker.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for the large picker and popup panel.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the picker input.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height of the small picker input.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of the large picker input.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the picker input.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for the small picker.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for the large picker.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of the picker input.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color used for selected month and active states.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the picker input.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the picker input and calendar cells.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the picker input.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Color of the placeholder text.',
          },
        },
      },
    },
  },
};
