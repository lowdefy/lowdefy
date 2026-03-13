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
  valueType: 'number',
  cssKeys: {
    element: 'The NumberInput element.',
    label: 'The NumberInput label.',
    extra: 'The NumberInput extra content.',
    feedback: 'The NumberInput validation feedback.',
  },
  events: {
    onBlur: 'Trigger action event occurs when number input loses focus.',
    onChange: 'Trigger action when number input is changed.',
    onFocus: 'Trigger action when number input gets focus.',
    onPressEnter: 'Trigger actions when input is focused and enter is pressed.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description:
          'Whether or not the number input has a border style. Deprecated, use variant instead.',
      },
      controls: {
        type: 'boolean',
        default: true,
        description: 'Whether or not to show the +- controls.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      formatter: {
        type: 'object',
        description: 'A function specifying the format of the value presented.',
        docs: {
          displayType: 'yaml',
        },
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'If enabled, control input with keyboard up and down.',
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
            description: 'Extra text to display beneath the content - supports html.',
          },
          title: {
            type: 'string',
            description: 'Label title - supports html.',
          },
          span: {
            type: 'number',
            description: 'Label inline span.',
          },
          disabled: {
            type: 'boolean',
            default: false,
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
      min: {
        type: 'number',
        description: 'Minimum value allowed by the block.',
      },
      max: {
        type: 'number',
        description: 'Maximum value allowed by the block.',
      },
      parser: {
        type: 'object',
        description: 'A function specifying the value extracted from the formatter.',
        docs: {
          displayType: 'yaml',
        },
      },
      placeholder: {
        type: 'string',
        description: 'Placeholder text inside the block to show message before user types input.',
      },
      decimalSeparator: {
        type: 'string',
        default: '.',
        description: 'Separator between number and decimal places.',
      },
      precision: {
        type: 'integer',
        description: 'Precision (number of decimal places) allowed by the block.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      step: {
        type: 'number',
        default: 1,
        description:
          'The number to which the current value is increased or decreased. It can be an integer or decimal.',
      },
      title: {
        type: 'string',
        description: 'Number input label title - supports html.',
      },
      variant: {
        type: 'string',
        enum: ['outlined', 'filled', 'borderless'],
        description: 'Input visual variant. When set, takes precedence over bordered.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/input-number#design-token',
        },
        properties: {
          activeBorderColor: {
            type: 'string',
            description: 'Border color when the input is active (focused).',
          },
          activeShadow: {
            type: 'string',
            description: 'Box shadow when the input is active.',
          },
          addonBg: {
            type: 'string',
            default: 'rgba(0,0,0,0.02)',
            description: 'Background color for addon areas.',
          },
          activeBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color when the input is active.',
          },
          controlWidth: {
            type: 'number',
            default: 90,
            description: 'Default width of the InputNumber control.',
          },
          errorActiveShadow: {
            type: 'string',
            description: 'Box shadow when the input is active in error status.',
          },
          filledHandleBg: {
            type: 'string',
            default: '#f0f0f0',
            description: 'Handle background color in filled variant.',
          },
          handleActiveBg: {
            type: 'string',
            default: 'rgba(0,0,0,0.02)',
            description: 'Handle background color when active (pressed).',
          },
          handleBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Default handle background color.',
          },
          handleBorderColor: {
            type: 'string',
            default: '#d9d9d9',
            description: 'Handle border color.',
          },
          handleFontSize: {
            type: 'number',
            default: 7,
            description: 'Font size of the handle icons (+/-).',
          },
          handleHoverColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Handle icon color on hover.',
          },
          handleOpacity: {
            type: 'number',
            default: 0,
            description: 'Default opacity of the handles (0 means hidden until hover).',
          },
          handleVisible: {
            type: 'string',
            default: 'auto',
            description: 'Handle visibility mode.',
          },
          handleWidth: {
            type: 'number',
            default: 22,
            description: 'Width of the spinner handles.',
          },
          hoverBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color on hover.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color on hover.',
          },
          inputFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for the default size input.',
          },
          inputFontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for the large size input.',
          },
          inputFontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for the small size input.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding for the default size.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for the large size.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for the small size.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the default size.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the large size.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for the small size.',
          },
          warningActiveShadow: {
            type: 'string',
            description: 'Box shadow when the input is active in warning status.',
          },
        },
      },
    },
  },
};
