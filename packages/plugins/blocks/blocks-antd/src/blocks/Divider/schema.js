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

const schema = {
  type: 'object',
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
        default: 'center',
        enum: ['left', 'right', 'center'],
        description: 'Position of title inside divider.',
      },
      title: {
        type: 'string',
        description: 'Divider title - supports html.',
      },
      type: {
        type: 'string',
        default: 'horizontal',
        enum: ['horizontal', 'vertical'],
        description: 'Direction type of divider',
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
        },
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
