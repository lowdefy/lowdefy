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
      offsetBottom: {
        type: 'number',
        description: 'Offset from the bottom of the viewport (in pixels).',
      },
      offsetTop: {
        type: 'number',
        description: 'Offset from the top of the viewport (in pixels).',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/affix#design-token',
        },
        properties: {
          zIndexPopup: {
            type: 'number',
            default: 10,
            description: 'Z-index of the affix element when fixed.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onChange: {
        type: 'array',
        description: 'Triggered when container affix status changes.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
