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

export default {
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
      inputStyle: {
        type: 'object',
        description: 'Css style to applied to input.',
        docs: {
          displayType: 'yaml',
        },
      },
      optionsStyle: {
        type: 'object',
        description: 'Css style to applied to option elements.',
        docs: {
          displayType: 'yaml',
        },
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
};
