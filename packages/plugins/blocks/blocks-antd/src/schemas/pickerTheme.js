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

// The date selectors all render the antd DatePicker, so they document one token set.
export default {
  type: 'object',
  description:
    'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
  docs: {
    displayType: 'yaml',
    link: 'https://ant.design/components/date-picker#design-token',
  },
  properties: {
    activeBg: {
      type: 'string',
      default: '#ffffff',
      description: 'Background color of the input when the picker is active/focused.',
    },
    activeBorderColor: {
      type: 'string',
      description: 'Border color when the picker is active/focused.',
    },
    activeShadow: {
      type: 'string',
      default: '0 0 0 2px rgba(5,145,255,0.1)',
      description: 'Shadow effect when the picker is active/focused.',
    },
    addonBg: {
      type: 'string',
      default: 'rgba(0, 0, 0, 0.02)',
      description: 'Background color of the footer addon area.',
    },
    borderRadius: {
      type: 'number',
      default: 6,
      description: 'Border radius of the picker input.',
    },
    borderRadiusLG: {
      type: 'number',
      default: 8,
      description: 'Border radius for the large picker and popup panel.',
    },
    borderRadiusSM: {
      type: 'number',
      default: 4,
      description: 'Border radius for the small picker.',
    },
    cellActiveWithRangeBg: {
      type: 'string',
      default: '#e6f4ff',
      description: 'Background color of cells within the selected range.',
    },
    cellBgDisabled: {
      type: 'string',
      default: 'rgba(0,0,0,0.04)',
      description: 'Background color of disabled cells.',
    },
    cellHeight: {
      type: 'number',
      default: 24,
      description: 'Height of a calendar cell.',
    },
    cellHoverBg: {
      type: 'string',
      default: 'rgba(0, 0, 0, 0.04)',
      description: 'Background color of a calendar cell on hover.',
    },
    cellHoverWithRangeBg: {
      type: 'string',
      default: '#cbe0fd',
      description: 'Background color of cells within range on hover.',
    },
    cellRangeBorderColor: {
      type: 'string',
      default: '#82b4f9',
      description: 'Border color of range selection cells.',
    },
    cellWidth: {
      type: 'number',
      default: 36,
      description: 'Width of a calendar cell.',
    },
    colorBgContainer: {
      type: 'string',
      description: 'Background color of the picker input.',
    },
    colorBorder: {
      type: 'string',
      description: 'Border color of the picker input.',
    },
    colorPrimary: {
      type: 'string',
      description: 'Primary color used for the selected date and active states.',
    },
    colorText: {
      type: 'string',
      description: 'Text color of the picker input and calendar cells.',
    },
    colorTextPlaceholder: {
      type: 'string',
      description: 'Color of the placeholder text.',
    },
    controlHeight: {
      type: 'number',
      default: 32,
      description: 'Height of the picker input.',
    },
    controlHeightLG: {
      type: 'number',
      default: 40,
      description: 'Height of the large picker input.',
    },
    controlHeightSM: {
      type: 'number',
      default: 24,
      description: 'Height of the small picker input.',
    },
    errorActiveShadow: {
      type: 'string',
      default: '0 0 0 2px rgba(255,38,5,0.06)',
      description: 'Shadow effect when the picker has error status and is focused.',
    },
    fontSize: {
      type: 'number',
      default: 14,
      description: 'Font size of the picker input.',
    },
    fontSizeLG: {
      type: 'number',
      default: 16,
      description: 'Font size for the large picker.',
    },
    fontSizeSM: {
      type: 'number',
      default: 14,
      description: 'Font size for the small picker.',
    },
    hoverBg: {
      type: 'string',
      default: '#ffffff',
      description: 'Background color of the input when hovering over the picker.',
    },
    hoverBorderColor: {
      type: 'string',
      description: 'Border color when hovering over the picker.',
    },
    lineWidth: {
      type: 'number',
      default: 1,
      description: 'Border width of the picker input.',
    },
    paddingBlock: {
      type: 'number',
      default: 4,
      description: 'Vertical padding for the default size picker.',
    },
    paddingBlockLG: {
      type: 'number',
      default: 7,
      description: 'Vertical padding for the large size picker.',
    },
    paddingBlockSM: {
      type: 'number',
      default: 0,
      description: 'Vertical padding for the small size picker.',
    },
    paddingInline: {
      type: 'number',
      default: 11,
      description: 'Horizontal padding for the default size picker.',
    },
    paddingInlineLG: {
      type: 'number',
      default: 11,
      description: 'Horizontal padding for the large size picker.',
    },
    paddingInlineSM: {
      type: 'number',
      default: 7,
      description: 'Horizontal padding for the small size picker.',
    },
    presetsMaxWidth: {
      type: 'number',
      default: 200,
      description: 'Maximum width of the presets list next to the calendar.',
    },
    presetsWidth: {
      type: 'number',
      default: 120,
      description: 'Width of the presets list next to the calendar.',
    },
    timeCellHeight: {
      type: 'number',
      default: 28,
      description: 'Height of a time cell in the time panel.',
    },
    timeColumnHeight: {
      type: 'number',
      default: 224,
      description: 'Height of the time panel column.',
    },
    timeColumnWidth: {
      type: 'number',
      default: 56,
      description: 'Width of the time panel column.',
    },
    warningActiveShadow: {
      type: 'string',
      default: '0 0 0 2px rgba(255,215,5,0.1)',
      description: 'Shadow effect when the picker has warning status and is focused.',
    },
    withoutTimeCellHeight: {
      type: 'number',
      default: 66,
      description: 'Height of the cells of the month, week, quarter, year and decade panels.',
    },
    zIndexPopup: {
      type: 'number',
      default: 1050,
      description: 'Z-index of the picker popup layer.',
    },
  },
};
