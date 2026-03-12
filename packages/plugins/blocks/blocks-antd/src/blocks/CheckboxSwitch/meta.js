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
  valueType: 'boolean',
  cssKeys: {
    element: 'The CheckboxSwitch element.',
    label: 'The CheckboxSwitch label.',
    extra: 'The CheckboxSwitch extra content.',
    feedback: 'The CheckboxSwitch validation feedback.',
  },
  events: {
    onChange: 'Trigger actions when selection is changed.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      color: {
        type: 'string',
        description: 'Selected checkbox color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      description: {
        type: 'string',
        description: 'Text to display next to the checkbox - supports html.',
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
      title: {
        type: 'string',
        description:
          'Title to describe the input component, if no title is specified the block id is displayed - supports html.',
      },
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
            description: 'Primary color used for the checked state background and border.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary color used when hovering over a checked checkbox.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the unchecked checkbox.',
          },
          colorBgContainerDisabled: {
            type: 'string',
            description: 'Background color of the checkbox when disabled.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the unchecked checkbox.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Color of the checkmark and label text when disabled.',
          },
          colorWhite: {
            type: 'string',
            description: 'Color of the checkmark icon inside the checked checkbox.',
          },
          controlInteractiveSize: {
            type: 'number',
            default: 16,
            description: 'Size (width and height) of the checkbox.',
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
          lineWidthBold: {
            type: 'number',
            default: 2,
            description: 'Width of the checkmark stroke inside the checkbox.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Large font size token, used to derive the indeterminate indicator size.',
          },
          paddingXS: {
            type: 'number',
            default: 8,
            description: 'Inline padding between the checkbox and its label text.',
          },
          marginXS: {
            type: 'number',
            default: 8,
            description: 'Column gap between checkboxes in a Checkbox.Group.',
          },
        },
      },
    },
  },
};
