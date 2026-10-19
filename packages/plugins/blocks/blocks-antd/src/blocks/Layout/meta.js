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
    content: 'Layout child blocks (Header, Sider, Content, Footer).',
  },
  cssKeys: {
    element: 'The Layout element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      hasSider: {
        type: 'boolean',
        default: false,
        description: 'Lay the child blocks out in a row when the layout contains a Sider.',
      },
      theme: {
        type: 'object',
        description:
          'Antd Layout design token overrides for this block. Header, Footer and Sider blocks inside the layout use them too. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/layout#design-token',
        },
        properties: {
          bodyBg: {
            type: 'string',
            default: '#f5f5f5',
            description: 'Background color of the layout.',
          },
          headerHeight: {
            type: 'number',
            default: 64,
            description: 'Height of Header blocks.',
          },
          headerPadding: {
            type: 'string',
            default: '0 50px',
            description: 'Padding of Header blocks.',
          },
          headerColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color of Header blocks.',
          },
          footerBg: {
            type: 'string',
            default: '#f5f5f5',
            description: 'Background color of Footer blocks.',
          },
          footerPadding: {
            type: 'string',
            default: '24px 50px',
            description: 'Padding of Footer blocks.',
          },
          triggerHeight: {
            type: 'number',
            default: 48,
            description: 'Height of the collapse trigger of a collapsible Sider.',
          },
          triggerBg: {
            type: 'string',
            default: '#002140',
            description: 'Background color of the collapse trigger of a dark Sider.',
          },
          triggerColor: {
            type: 'string',
            default: '#fff',
            description: 'Color of the collapse trigger of a dark Sider.',
          },
          lightTriggerBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the collapse trigger of a light Sider.',
          },
          lightTriggerColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Color of the collapse trigger of a light Sider.',
          },
        },
      },
    },
  },
};
