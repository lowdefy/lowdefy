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
import { disabled, inputTitle, sizeSmallDefaultLarge } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  valueType: 'array',
  icons: [...LabelMeta.icons],
  cssKeys: {
    element: 'The TagSelector tag row.',
    tag: 'Each tag pill.',
    label: 'The TagSelector label.',
    extra: 'The TagSelector extra content.',
    feedback: 'The TagSelector validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when the selection is changed.',
      event: { value: 'The array of selected values.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      options: {
        type: 'array',
        description:
          'Options to select from. Primitives, or { label, value, color, disabled } - an explicit color overrides the stable palette color.',
        items: {
          type: ['string', 'number', 'boolean', 'object'],
          properties: {
            label: {
              type: 'string',
              description: 'Tag label. Defaults to the value.',
            },
            value: {
              description: 'Option value written into the selection array.',
              docs: {
                displayType: 'yaml',
              },
            },
            color: {
              type: 'string',
              description:
                'Explicit tag color (hex or CSS color). Overrides the stable palette color.',
              docs: {
                displayType: 'color',
              },
            },
            disabled: {
              type: 'boolean',
              default: false,
              description: 'Disable this tag.',
            },
          },
        },
      },
      colored: {
        type: 'boolean',
        default: true,
        description:
          'Give each option a stable color (hash of its value over a fixed palette). false = single primary accent.',
      },
      disabled,
      size: sizeSmallDefaultLarge,
      label,
      title: inputTitle,
    },
  },
};
