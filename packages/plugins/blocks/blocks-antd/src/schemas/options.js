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
            oneOf: [
              {
                type: 'string',
                description: 'Option value.',
              },
              {
                type: 'number',
                description: 'Option value.',
              },
              {
                type: 'boolean',
                description: 'Option value.',
              },
            ],
          },
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Disable the option if true.',
          },
          style: {
            type: 'object',
            description: 'Css style to apply to the option.',
            docs: {
              displayType: 'yaml',
            },
          },
        },
      },
    },
  ],
};
