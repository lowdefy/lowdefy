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

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'string',
  cssKeys: {
    element: 'The AutoComplete element.',
    label: 'The AutoComplete label.',
    extra: 'The AutoComplete extra content.',
    feedback: 'The AutoComplete validation feedback.',
    options: 'The AutoComplete options.',
  },
  events: {
    onBlur: 'Trigger action event occurs when selector loses focus.',
    onChange: 'Trigger actions when selection is changed.',
    onFocus: 'Trigger action when an selector gets focus.',
    onClear: 'Trigger action when selector gets cleared.',
    onSearch: 'Called when searching items.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        type: 'boolean',
        default: true,
        description: 'Allow the user to clear the selected value, sets the value to null.',
      },
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Whether or not the input has a border style.',
      },
      backfill: {
        type: 'boolean',
        default: false,
        description: 'Backfill selected item the input when using keyboard',
      },
      defaultOpen: {
        type: 'boolean',
        default: false,
        description: 'Initial open state of dropdown.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      label: {
        type: 'object',
        description: 'Label properties.',
        additionalProperties: false,
        properties: {
          align: {
            type: 'string',
            enum: ['left', 'right'],
            default: 'left',
            description: 'Align label left or right when inline.',
          },
          colon: {
            type: 'boolean',
            default: true,
            description: 'Append label with colon.',
          },
          extra: {
            type: 'string',
            description: 'Extra text to display beneath the content.',
          },
          title: {
            type: 'string',
            description: 'Label title.',
          },
          span: {
            type: 'number',
            description: 'Label inline span.',
          },
          disabled: {
            type: 'boolean',
            description: 'Hide input label.',
          },
          hasFeedback: {
            type: 'boolean',
            default: true,
            description:
              'Display feedback extra from validation, this does not disable validation.',
          },
          inline: {
            type: 'boolean',
            default: false,
            description: 'Render input and label inline.',
          },
        },
      },
      options: {
        default: [],
        type: 'array',
        description: 'Options can either be an array of string values.',
        items: {
          type: 'string',
        },
      },
      placeholder: {
        type: 'string',
        default: 'Type or select item',
        description: 'Placeholder text inside the block before user selects input.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      title: {
        type: 'string',
        description:
          'Title to describe the input component, if no title is specified the block id is displayed.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/select#design-token',
        },
        properties: {
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the input.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large size.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small size.',
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
            description: 'Font size of the input text.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large size.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for small size.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color, used for focus border and active state.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary hover color, used for hover border state.',
          },
          colorBgContainer: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the selector.',
          },
          colorBgElevated: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the dropdown.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the input.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Placeholder text color.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Text color when disabled.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the input.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when hovered.',
          },
          activeBorderColor: {
            type: 'string',
            description: 'Border color when focused/active.',
          },
          activeOutlineColor: {
            type: 'string',
            description: 'Outline color when focused.',
          },
          clearBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the clear button.',
          },
          optionSelectedBg: {
            type: 'string',
            default: '#e6f4ff',
            description: 'Background color of the selected option.',
          },
          optionSelectedColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color of the selected option.',
          },
          optionSelectedFontWeight: {
            type: 'number',
            default: 600,
            description: 'Font weight of the selected option.',
          },
          optionActiveBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background color of the active (hovered) option.',
          },
          optionFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of dropdown option text.',
          },
          optionHeight: {
            type: 'number',
            default: 32,
            description: 'Height of each dropdown option.',
          },
          optionLineHeight: {
            type: 'number',
            description: 'Line height of dropdown option text.',
          },
          optionPadding: {
            type: ['string', 'number'],
            default: '5px 12px',
            description: 'Padding of each dropdown option.',
          },
          selectorBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the selector input.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the dropdown popup.',
          },
          showArrowPaddingInlineEnd: {
            type: 'number',
            default: 18,
            description: 'Right padding when the arrow icon is shown.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of the input.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding of the input.',
          },
        },
      },
    },
  },
};
