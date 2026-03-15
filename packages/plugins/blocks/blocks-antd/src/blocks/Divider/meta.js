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
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Divider element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      dashed: {
        type: 'boolean',
        default: false,
        description: 'Whether line is dashed.',
      },
      orientation: {
        type: 'string',
        default: 'horizontal',
        enum: ['horizontal', 'vertical'],
        description: 'Direction of the divider line.',
      },
      title: {
        type: 'string',
        description: 'Divider title - supports html.',
      },
      titlePlacement: {
        type: 'string',
        default: 'center',
        enum: ['left', 'right', 'center'],
        description: 'Position of title text within the divider.',
      },
      plain: {
        type: 'boolean',
        default: false,
        description: 'Show text as plain style.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/divider#design-token',
        },
        properties: {
          textPaddingInline: {
            type: 'string',
            default: '1em',
            description: 'Horizontal padding of text content in the divider.',
          },
          orientationMargin: {
            type: 'number',
            default: 0.05,
            description:
              'Distance between text and edge when orientation is left or right. Value between 0 and 1 representing a percentage.',
          },
          verticalMarginInline: {
            type: 'number',
            default: 8,
            description: 'Horizontal margin for vertical dividers.',
          },
        },
      },
    },
  },
};
