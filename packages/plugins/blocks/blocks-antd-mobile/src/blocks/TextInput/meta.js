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
  category: 'input',
  icons: [],
  valueType: 'string',
  cssKeys: {
    block: 'The block wrapper element.',
    element: 'The Input element.',
    label: 'The field label.',
    validation: 'The validation message.',
  },
  events: {
    onChange: 'Trigger actions when the input value changes.',
    onPressEnter: 'Trigger actions when the enter key is pressed.',
    onBlur: 'Trigger actions when the input loses focus.',
    onFocus: 'Trigger actions when the input gains focus.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      clearable: {
        type: 'boolean',
        description: 'Show a clear icon when the input has a value.',
        default: false,
      },
      disabled: {
        type: 'boolean',
        description: 'Disable the input if true.',
        default: false,
      },
      label: {
        type: 'object',
        description: 'Label properties: { title, disabled }.',
        properties: {
          title: {
            type: 'string',
            description: 'Label title - supports html.',
          },
          disabled: {
            type: 'boolean',
            description: 'Hide the label.',
            default: false,
          },
        },
      },
      maxLength: {
        type: 'number',
        description: 'Maximum number of characters.',
      },
      placeholder: {
        type: 'string',
        description: 'Placeholder text inside the input.',
      },
      title: {
        type: 'string',
        description: 'Field label title - supports html.',
      },
      type: {
        type: 'string',
        description: 'HTML input type, e.g. "text", "email", "tel", "number".',
        default: 'text',
      },
    },
  },
};
