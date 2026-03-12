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
  slots: ['content', 'cover', 'extra', 'title'],
  cssKeys: {
    element: 'The Card element.',
    header: 'The Card header.',
    body: 'The Card body.',
    cover: 'The Card cover.',
    actions: 'The Card actions.',
    extra: 'The Card extra content.',
  },
  events: {
    onClick: 'Trigger actions when the Card is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Toggles rendering of the border around the card.',
      },
      hoverable: {
        type: 'boolean',
        default: false,
        description: 'Lift up when hovering card.',
      },
      inner: {
        type: 'boolean',
        default: false,
        description: 'Change the card style to inner.',
      },
      size: {
        type: 'string',
        enum: ['default', 'small'],
        default: 'default',
        description: 'Size of the card.',
      },
      title: {
        type: 'string',
        description:
          'Title to show in the title area - supports html. Overwritten by blocks in the title content area.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/card#design-token',
        },
        properties: {
          headerBg: {
            type: 'string',
            default: 'transparent',
            description: 'Background color of the card header.',
          },
          headerFontSize: {
            type: 'number',
            default: 16,
            description: 'Font size of the card header title.',
          },
          headerFontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size of the card header title for small cards.',
          },
          headerHeight: {
            type: 'number',
            default: 56,
            description: 'Height of the card header.',
          },
          headerHeightSM: {
            type: 'number',
            default: 38,
            description: 'Height of the card header for small cards.',
          },
          actionsBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the card actions area.',
          },
          actionsLiMargin: {
            type: 'string',
            default: '12px 0',
            description: 'Margin of each action item in the card actions area.',
          },
          tabsMarginBottom: {
            type: 'number',
            default: -17,
            description: 'Bottom margin adjustment for tabs in the card.',
          },
          extraColor: {
            type: 'string',
            default: 'rgba(0,0,0,0.88)',
            description: 'Text color for the extra content area in the header.',
          },
          bodyPadding: {
            type: 'number',
            default: 24,
            description: 'Padding of the card body.',
          },
          bodyPaddingSM: {
            type: 'number',
            default: 12,
            description: 'Padding of the card body for small cards.',
          },
          headerPadding: {
            type: 'number',
            default: 24,
            description: 'Horizontal padding of the card header.',
          },
          headerPaddingSM: {
            type: 'number',
            default: 12,
            description: 'Horizontal padding of the card header for small cards.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of the card.',
          },
          colorBorderSecondary: {
            type: 'string',
            description: 'Border color of the card.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the card body.',
          },
          colorText: {
            type: 'string',
            description: 'Text color inside the card.',
          },
          colorTextHeading: {
            type: 'string',
            description: 'Color of the card header title text.',
          },
          boxShadowTertiary: {
            type: 'string',
            description: 'Shadow applied to the card on hover when hoverable is true.',
          },
        },
      },
    },
  },
};
