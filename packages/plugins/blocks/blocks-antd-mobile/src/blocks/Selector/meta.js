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
  valueType: 'any',
  cssKeys: {
    block: 'The block wrapper element.',
    element: 'The trigger field element.',
    label: 'The field label.',
    validation: 'The validation message.',
  },
  events: {
    onChange: 'Trigger actions when a value is selected.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      cancelText: {
        type: 'string',
        description: 'Text of the picker cancel button.',
      },
      confirmText: {
        type: 'string',
        description: 'Text of the picker confirm button.',
      },
      disabled: {
        type: 'boolean',
        description: 'Disable the selector if true.',
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
      options: {
        type: 'array',
        description:
          'List of options. Each option is a primitive value or a { label, value } object.',
      },
      pickerTitle: {
        type: 'string',
        description: 'Title shown in the picker header.',
      },
      placeholder: {
        type: 'string',
        description: 'Placeholder text shown when no value is selected.',
        default: 'Select',
      },
      title: {
        type: 'string',
        description: 'Field label title - supports html.',
      },
    },
  },
};
