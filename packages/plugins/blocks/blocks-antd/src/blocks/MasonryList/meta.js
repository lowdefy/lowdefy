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
  category: 'list',
  icons: [],
  valueType: 'array',
  slots: {
    content: 'Blocks rendered for each masonry item.',
  },
  cssKeys: {
    element: 'The MasonryList element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: ['integer', 'object'],
        description:
          'Number of columns, or responsive breakpoint object (e.g. { xs: 1, sm: 2, md: 3 }).',
        docs: {
          displayType: 'yaml',
        },
      },
      fresh: {
        type: 'boolean',
        default: false,
        description: 'Force refresh the masonry layout.',
      },
      gutter: {
        type: ['number', 'array'],
        description: 'Gap between items in pixels. Number or [horizontal, vertical] array.',
        docs: {
          displayType: 'yaml',
        },
      },
      sequential: {
        type: 'boolean',
        default: false,
        description:
          'Render items sequentially (top to bottom, then next column). Default is balanced column-fill.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. Masonry uses global motion tokens for item animations. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/masonry',
        },
        properties: {
          motionDurationSlow: {
            type: 'string',
            default: '0.3s',
            description: 'Duration of item position and fade-in animations.',
          },
          motionDurationFast: {
            type: 'string',
            default: '0.1s',
            description: 'Duration of item fade-out animations.',
          },
          motionEaseOut: {
            type: 'string',
            default: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            description: 'Easing function for item animations.',
          },
        },
      },
    },
  },
};
