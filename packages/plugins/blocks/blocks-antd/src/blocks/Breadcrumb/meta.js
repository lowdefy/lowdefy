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

import breadcrumbList from '../../schemas/breadcrumbList.js';

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Breadcrumb element.',
    icon: 'The icon in the Breadcrumb.',
  },
  events: {
    onClick: {
      description: 'Triggered when breadcrumb item is clicked.',
      event: { link: 'The clicked breadcrumb link.', index: 'The index of the clicked item.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      separator: {
        type: 'string',
        default: '/',
        description: 'Use a custom separator string.',
      },
      list: breadcrumbList,
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/breadcrumb#design-token',
        },
        properties: {
          itemColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Text color of breadcrumb item.',
          },
          iconFontSize: {
            type: 'number',
            default: 14,
            description: 'Icon size of breadcrumb item.',
          },
          linkColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Text color of link.',
          },
          linkHoverColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Color of hovered link.',
          },
          lastItemColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color of the last item.',
          },
          separatorMargin: {
            type: 'number',
            default: 8,
            description: 'Margin of separator.',
          },
          separatorColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Color of separator.',
          },
        },
      },
    },
  },
};
