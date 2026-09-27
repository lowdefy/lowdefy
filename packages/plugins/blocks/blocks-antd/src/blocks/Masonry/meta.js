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
    item: 'Each item in the masonry grid.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: ['integer', 'object'],
        default: 3,
        description:
          'Number of columns, or responsive breakpoint object (e.g. { xs: 1, sm: 2, md: 3 }).',
        docs: {
          displayType: 'yaml',
        },
      },
      fresh: {
        type: 'boolean',
        default: false,
        description:
          'Keep watching the size of each item and re-layout when it changes, for items whose height changes after they render (images loading, expanding content).',
      },
      gutter: {
        type: ['number', 'array', 'object'],
        default: 0,
        description:
          'Gap between items in pixels. A number, a responsive breakpoint object (e.g. { xs: 8, md: 16 }), or a [horizontal, vertical] array of either.',
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
