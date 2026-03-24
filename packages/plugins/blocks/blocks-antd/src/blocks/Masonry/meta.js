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
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content: 'Child blocks arranged in a masonry grid.',
  },
  cssKeys: {
    element: 'The Masonry element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: ['integer', 'object'],
        description: 'Number of columns, or responsive breakpoint object.',
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
        description: 'Gap between items. Number or [horizontal, vertical] array.',
        docs: {
          displayType: 'yaml',
        },
      },
      sequential: {
        type: 'boolean',
        default: false,
        description: 'Whether to render items sequentially.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/masonry#design-token',
        },
        properties: {
          motionDurationSlow: {
            type: 'string',
            default: '0.3s',
            description: 'Duration for item position transitions and appear animations.',
          },
          motionDurationFast: {
            type: 'string',
            default: '0.1s',
            description: 'Duration for item leave animations.',
          },
          motionEaseOut: {
            type: 'string',
            default: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            description: 'Easing function for item transitions.',
          },
        },
      },
    },
  },
};
