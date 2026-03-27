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
import options from '../../schemas/options.js';
import { disabled, inputTitle } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'array',
  cssKeys: {
    element: 'The CheckboxSelector element.',
    label: 'The CheckboxSelector label.',
    extra: 'The CheckboxSelector extra content.',
    feedback: 'The CheckboxSelector validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected value.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      align: {
        type: 'string',
        enum: ['start', 'end', 'center', 'baseline'],
        default: 'start',
        description: 'Align options.',
      },
      color: {
        type: 'string',
        description: 'Selected checkbox color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled,
      direction: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'List options horizontally or vertical.',
      },
      wrap: {
        type: 'boolean',
        default: true,
        description: "Specifies wrapping of options. Applies when 'direction' is 'horizontal'.",
      },
      options,
      label,
      title: inputTitle,
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/checkbox#design-token',
        },
        properties: {
          colorPrimary: {
            type: 'string',
            description: 'Primary color for checked checkboxes.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Hover color for checked checkboxes.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color for unchecked checkboxes.',
          },
          colorBgContainerDisabled: {
            type: 'string',
            description: 'Background color for disabled checkboxes.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color for unchecked checkboxes.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Text and checkmark color for disabled checkboxes.',
          },
          controlInteractiveSize: {
            type: 'number',
            default: 16,
            description: 'Size of the checkbox (width and height in pixels).',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius of the checkbox.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of the checkbox.',
          },
          lineType: {
            type: 'string',
            default: 'solid',
            description: 'Border style of the checkbox.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for checkbox labels.',
          },
          marginXS: {
            type: 'number',
            default: 8,
            description: 'Horizontal gap between checkboxes in a group.',
          },
          paddingXS: {
            type: 'number',
            default: 8,
            description: 'Inline padding between the checkbox and its label text.',
          },
        },
      },
    },
  },
};
