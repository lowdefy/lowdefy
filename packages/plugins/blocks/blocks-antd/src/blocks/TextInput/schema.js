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

const schema = {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        type: 'boolean',
        default: false,
        description: 'Allow the user to clear their input.',
      },
      type: {
        type: 'string',
        enum: ['text', 'number', 'password', 'tel', 'email', 'url'],
        default: 'text',
        description:
          "The type of input, (see <a href='https://developer.mozilla.org/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types'>MDN</a>).",
      },
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Whether or not the text input has a border style.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      maxLength: {
        type: 'integer',
        description: 'The max number of input characters.',
      },
      placeholder: {
        type: 'string',
        description: 'Placeholder text inside the block before user types input.',
      },
      prefix: {
        type: 'string',
        description: 'Prefix text for the block, priority over $prefix_con.',
      },
      prefixIcon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to prefix the text input.",
        docs: {
          displayType: 'icon',
        },
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
      replaceInput: {
        type: 'object',
        description: 'Regex used to sanitize input.',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regular expression pattern to use to sanitize input.',
          },
          flags: {
            type: 'string',
            description: "The regex flags to use. The default value is 'gm'.",
          },
          replacement: {
            type: 'string',
            description:
              "The string used to replace the input that matches the pattern. The default value is ''.",
          },
        },
        docs: {
          displayType: 'yaml',
        },
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        default: 'middle',
        description: 'Size of the block.',
      },
      showCount: {
        type: 'boolean',
        default: false,
        description: 'Show text character count',
      },
      suffix: {
        type: 'string',
        description: 'Suffix text for the block, priority over suffixIcon.',
      },
      suffixIcon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to suffix the text input.",
        docs: {
          displayType: 'icon',
        },
      },
      title: {
        type: 'string',
        description:
          'Title to describe the input component, if no title is specified the block id is displayed - supports html.',
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
          link: 'https://ant.design/components/input#design-token',
        },
        properties: {
          activeBorderColor: {
            type: 'string',
            description: 'Border color when the input is focused.',
          },
          activeShadow: {
            type: 'string',
            description: 'Box shadow when the input is focused.',
          },
          addonBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color of addon elements.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the input.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large inputs.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small inputs.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the input.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the input.',
          },
          colorError: {
            type: 'string',
            description: 'Color used for error status.',
          },
          colorFillTertiary: {
            type: 'string',
            description: 'Background fill color for the filled variant.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the input value.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Text color when input is disabled.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Color of the placeholder text.',
          },
          colorWarning: {
            type: 'string',
            description: 'Color used for warning status.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the input.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large inputs.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small inputs.',
          },
          errorActiveShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(255, 38, 5, 0.06)',
            description: 'Box shadow when the input has error status and is focused.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the input.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large inputs.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for small inputs.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when the input is hovered.',
          },
          hoverBg: {
            type: 'string',
            description: 'Background color when the input is hovered.',
          },
          activeBg: {
            type: 'string',
            description: 'Background color when the input is focused.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for large inputs.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for small inputs.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for large inputs.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for small inputs.',
          },
          warningActiveShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(255, 215, 5, 0.1)',
            description: 'Box shadow when the input has warning status and is focused.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onBlur: {
        type: 'array',
        description: 'Trigger action event occurs when text input loses focus.',
      },
      onChange: {
        type: 'array',
        description: 'Trigger action when text input is changed.',
      },
      onFocus: {
        type: 'array',
        description: 'Trigger action when text input gets focus.',
      },
      onPressEnter: {
        type: 'array',
        description: 'Trigger action when enter is pressed while text input is focused.',
      },
    },
  },
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default schema;
