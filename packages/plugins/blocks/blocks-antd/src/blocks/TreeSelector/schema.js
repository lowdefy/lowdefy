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
      checkable: {
        type: 'boolean',
        default: false,
        description: 'Make nodes checkboxes.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      showLine: {
        type: 'boolean',
        default: false,
        description: 'Show a connecting line if true.',
      },
      selectable: {
        type: 'boolean',
        default: true,
        description: 'Selectable if true.',
      },
      options: {
        default: [],
        oneOf: [
          {
            type: 'array',
            description: 'Options can either be an array of label, value pairs.',
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
                  description: 'Disable the node if true.',
                  default: false,
                },
                disableCheckbox: {
                  type: 'boolean',
                  description: 'Disable the checkbox if true.',
                  default: false,
                },
                style: {
                  type: 'object',
                  description: 'Css style to applied to option.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
                children: {
                  type: 'array',
                  description: 'Options can either be an array of label, value pairs.',
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
                        description: 'Disable the node if true.',
                        default: false,
                      },
                      disableCheckbox: {
                        type: 'boolean',
                        description: 'Disable the checkbox if true.',
                        default: false,
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
              },
            },
          },
        ],
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/tree-select#design-token',
        },
        properties: {
          nodeSelectedBg: {
            type: 'string',
            description: 'Background color of selected tree node.',
          },
          nodeHoverBg: {
            type: 'string',
            description: 'Background color of hovered tree node.',
          },
          titleHeight: {
            type: 'number',
            default: 24,
            description: 'Height of tree node title.',
          },
          directoryNodeSelectedBg: {
            type: 'string',
            description: 'Background color of selected directory node.',
          },
          directoryNodeSelectedColor: {
            type: 'string',
            description: 'Text color of selected directory node.',
          },
          clearBg: {
            type: 'string',
            description: 'Background color of clear button.',
          },
          selectorBg: {
            type: 'string',
            description: 'Background color of the selector.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when hovered.',
          },
          activeBorderColor: {
            type: 'string',
            description: 'Border color when active/focused.',
          },
          activeOutlineColor: {
            type: 'string',
            description: 'Outline color when active/focused.',
          },
          optionSelectedBg: {
            type: 'string',
            description: 'Background of selected option.',
          },
          optionSelectedColor: {
            type: 'string',
            description: 'Text color of selected option.',
          },
          optionSelectedFontWeight: {
            type: 'string',
            description: 'Font weight of selected option.',
          },
          optionActiveBg: {
            type: 'string',
            description: 'Background of active (hovered) option.',
          },
          optionFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of options.',
          },
          optionHeight: {
            type: 'number',
            default: 32,
            description: 'Height of each option.',
          },
          optionLineHeight: {
            type: 'string',
            description: 'Line height of options.',
          },
          optionPadding: {
            type: 'string',
            description: 'Padding of options.',
          },
          multipleSelectorBgDisabled: {
            type: 'string',
            description: 'Background when disabled in multiple mode.',
          },
          multipleItemBg: {
            type: 'string',
            description: 'Background of tag items in multiple mode.',
          },
          multipleItemBorderColor: {
            type: 'string',
            description: 'Border color of tag items.',
          },
          multipleItemHeight: {
            type: 'number',
            default: 24,
            description: 'Height of tag items.',
          },
          multipleItemHeightSM: {
            type: 'number',
            default: 16,
            description: 'Height of tag items (small).',
          },
          multipleItemHeightLG: {
            type: 'number',
            default: 32,
            description: 'Height of tag items (large).',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'z-index of the dropdown.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onChange: {
        type: 'array',
        description: 'Trigger action when selection is changed.',
      },
    },
  },
  cssKeys: ['element', 'options'],
};

export default schema;
