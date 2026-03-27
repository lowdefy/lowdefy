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
import {
  disabled,
  autoFocus,
  variant,
  bordered,
  allowClear,
  sizeSmallDefaultLarge,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'array',
  cssKeys: {
    element: 'The MultipleSelector element.',
    clearIcon: 'The clear icon in the MultipleSelector.',
    label: 'The MultipleSelector label.',
    extra: 'The MultipleSelector extra content.',
    feedback: 'The MultipleSelector validation feedback.',
    options: 'The MultipleSelector options.',
    selectedIcon: 'The selected item icon in the MultipleSelector.',
    suffixIcon: 'The suffix icon in the MultipleSelector.',
  },
  events: {
    onChange: 'Trigger actions when selection is changed.',
    onBlur: 'Trigger action event occurs when selector loses focus.',
    onFocus: 'Trigger action when selector gets focus.',
    onClear: 'Trigger action when selector gets cleared.',
    onSearch: {
      description: 'Trigger actions when input is changed.',
      event: { value: 'The search input value.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        ...allowClear,
        default: true,
        description: 'Allow the user to clear the selected value, sets the value to null.',
      },
      autoClearSearchValue: {
        type: 'boolean',
        default: true,
        description: 'Whether the current search will be cleared on selecting an item.',
      },
      autoFocus,
      bordered: {
        ...bordered,
        description:
          'Whether or not the selector has a border style. Deprecated, use variant instead.',
      },
      clearIcon: {
        ...icon,
        default: 'AiOutlineCloseCircle',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input.",
      },
      disabled,
      label,
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
                tag: {
                  type: 'object',
                  properties: {
                    color: {
                      type: 'string',
                      description:
                        'Color of the Tag. Preset options are success, processing, error, warning, default, blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, or alternatively any hex color.',
                      docs: {
                        displayType: 'color',
                      },
                    },
                    title: {
                      type: 'string',
                      description: 'Content title of tag - supports html.',
                    },
                    icon: {
                      type: ['string', 'object'],
                      description:
                        'Name of an Ant Design Icon or properties of an Icon block to customize alert icon.',
                      docs: {
                        displayType: 'icon',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      maxTagCount: {
        type: 'number',
        description: 'Max tag count to show.',
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
      selectedIcon: {
        ...icon,
        default: 'AiOutlineCheck',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon showing when a selection is made in the drop-down list.",
      },
      showArrow: {
        type: 'boolean',
        default: true,
        description: 'Show the suffix icon at the drop-down position of the selector.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: {
        ...icon,
        default: 'AiOutlineDown',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize at the drop-down position of the selector.",
      },
      title: {
        type: 'string',
        description: 'Multiple selector label title - supports html.',
      },
      variant,
      renderTags: {
        type: 'boolean',
        description:
          'When true, the selected option labels are rendered as tags in the selector input. This field must be true to render option tag values.',
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
          clearBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the clear button.',
          },
          hoverBorderColor: {
            type: 'string',
            default: '#4096ff',
            description: 'Border color when the selector is hovered.',
          },
          activeBorderColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Border color when the selector is focused/active.',
          },
          activeOutlineColor: {
            type: 'string',
            default: 'rgba(5, 145, 255, 0.1)',
            description: 'Outline color when the selector is focused/active.',
          },
          selectorBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the selector.',
          },
          multipleItemBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.06)',
            description: 'Background color for selected items in multiple mode.',
          },
          multipleItemBorderColor: {
            type: 'string',
            default: 'transparent',
            description: 'Border color for selected items in multiple mode.',
          },
          multipleItemHeight: {
            type: 'number',
            default: 24,
            description: 'Height of selected items in multiple mode.',
          },
          multipleItemHeightSM: {
            type: 'number',
            default: 16,
            description: 'Height of selected items in small multiple mode.',
          },
          multipleItemHeightLG: {
            type: 'number',
            default: 32,
            description: 'Height of selected items in large multiple mode.',
          },
          multipleSelectorBgDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background color of the selector when disabled in multiple mode.',
          },
          multipleItemColorDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Text color of selected items when disabled in multiple mode.',
          },
          multipleItemBorderColorDisabled: {
            type: 'string',
            default: 'transparent',
            description: 'Border color of selected items when disabled in multiple mode.',
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
          optionActiveBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background color of the active/hovered option in the dropdown.',
          },
          optionFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of options in the dropdown.',
          },
          optionHeight: {
            type: 'number',
            default: 32,
            description: 'Height of each option in the dropdown.',
          },
          optionLineHeight: {
            type: 'number',
            description: 'Line height of options in the dropdown.',
          },
          optionPadding: {
            type: 'string',
            default: '5px 12px',
            description: 'Padding inside each dropdown option.',
          },
          singleItemHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of the selector in large single mode.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the dropdown popup.',
          },
          showArrowPaddingInlineEnd: {
            type: 'number',
            default: 18,
            description: 'Padding at the inline end when the arrow is shown.',
          },
        },
      },
    },
  },
};
