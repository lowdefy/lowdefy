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
  valueType: 'any',
  cssKeys: {
    element: 'The Selector element.',
    clearIcon: 'The clear icon in the Selector.',
    label: 'The Selector label.',
    extra: 'The Selector extra content.',
    feedback: 'The Selector validation feedback.',
    options: 'The Selector options.',
    suffixIcon: 'The suffix icon in the Selector.',
  },
  events: {
    onBlur: 'Trigger action event occurs when selector loses focus.',
    onChange: 'Trigger action when selection is changed.',
    onFocus: 'Trigger action when selector gets focus.',
    onClear: 'Trigger action when selector is cleared.',
    onSearch:
      "Trigger actions when input is changed. 'value' is passed to the _event operator to be used in actions such as search queries.",
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
        description:
          'Whether or not the selector has a border style. Deprecated, use variant instead.',
      },
      clearIcon: {
        type: ['string', 'object'],
        default: 'AiOutlineCloseCircle',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input.",
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
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      options: {
        default: [],
        oneOf: [
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs - supports html.',
            items: {
              type: 'string',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs.',
            items: {
              type: 'number',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs.',
            items: {
              type: 'boolean',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs.',
            items: {
              type: 'object',
              required: ['value'],
              properties: {
                label: {
                  type: 'string',
                  description: 'Value label shown to user - supports html.',
                },
                value: {
                  description: 'Value selected. Can be of any type.',
                  oneOf: [
                    {
                      type: 'string',
                    },
                    {
                      type: 'number',
                    },
                    {
                      type: 'boolean',
                    },
                    {
                      type: 'object',
                    },
                    {
                      type: 'array',
                    },
                  ],
                  docs: {
                    displayType: 'yaml',
                  },
                },
                disabled: {
                  type: 'boolean',
                  default: false,
                  description: 'Disable the option if true.',
                },
                filterString: {
                  type: 'string',
                  description:
                    'String to match against when filtering selector options during. If no filterString is provided the filter method matches against options.label.',
                },
                style: {
                  type: 'object',
                  description: 'Css style to applied to option.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
              },
            },
          },
        ],
      },
      placeholder: {
        type: 'string',
        default: 'Select item',
        description: 'Placeholder text inside the block before user selects input.',
      },
      loadingPlaceholder: {
        type: 'string',
        default: 'Loading',
        description: 'Placeholder text to show in options while the block is loading.',
      },
      notFoundContent: {
        type: 'string',
        default: 'not Found',
        description: 'Placeholder text to show when list of options are empty.',
      },
      showArrow: {
        type: 'boolean',
        default: true,
        description: 'Show the suffix icon at the drop-down position of the selector.',
      },
      showSearch: {
        type: 'boolean',
        default: true,
        description: 'Make the selector options searchable.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      suffixIcon: {
        type: ['string', 'object'],
        default: 'AiOutlineDown',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon at the drop-down position of the selector.",
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
          link: 'https://ant.design/components/select#design-token',
        },
        properties: {
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the selector.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large selectors.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small selectors.',
          },
          clearBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the clear button.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the selector.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override for the selector.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the selector input.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the selector.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large selectors.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small selectors.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the selector input text.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large selectors.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for small selectors.',
          },
          hoverBorderColor: {
            type: 'string',
            default: '#4096ff',
            description: 'Border color when the selector is hovered.',
          },
          activeBorderColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Border color when the selector is focused or active.',
          },
          activeOutlineColor: {
            type: 'string',
            default: 'rgba(5, 145, 255, 0.1)',
            description: 'Outline color when the selector is focused.',
          },
          multipleItemBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.06)',
            description: 'Background color of selected items in multiple mode.',
          },
          multipleItemBorderColor: {
            type: 'string',
            default: 'transparent',
            description: 'Border color of selected items in multiple mode.',
          },
          multipleItemHeight: {
            type: 'number',
            default: 24,
            description: 'Height of selected item tags in multiple mode.',
          },
          multipleItemHeightSM: {
            type: 'number',
            default: 16,
            description: 'Height of selected item tags in small multiple mode.',
          },
          multipleItemHeightLG: {
            type: 'number',
            default: 32,
            description: 'Height of selected item tags in large multiple mode.',
          },
          multipleSelectorBgDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background of the selector in disabled multiple mode.',
          },
          multipleItemColorDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Text color of disabled items in multiple mode.',
          },
          multipleItemBorderColorDisabled: {
            type: 'string',
            default: 'transparent',
            description: 'Border color of disabled items in multiple mode.',
          },
          optionActiveBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background color of an option when hovered or active.',
          },
          optionFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of option text in the dropdown.',
          },
          optionHeight: {
            type: 'number',
            default: 32,
            description: 'Height of each option in the dropdown.',
          },
          optionLineHeight: {
            type: 'number',
            description: 'Line height of option text in the dropdown.',
          },
          optionPadding: {
            type: ['string', 'number'],
            default: '5px 12px',
            description: 'Padding inside each option in the dropdown.',
          },
          optionSelectedBg: {
            type: 'string',
            default: '#e6f4ff',
            description: 'Background color of the selected option in the dropdown.',
          },
          optionSelectedColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color of the selected option in the dropdown.',
          },
          optionSelectedFontWeight: {
            type: 'number',
            default: 600,
            description: 'Font weight of the selected option in the dropdown.',
          },
          selectorBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the selector input area.',
          },
          showArrowPaddingInlineEnd: {
            type: 'number',
            default: 18,
            description: 'Padding at the inline end when the arrow is shown.',
          },
          singleItemHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of the selector input in large single mode.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the dropdown popup.',
          },
        },
      },
    },
  },
};
