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
  cssKeys: {
    element: 'The Tabs element.',
    icon: 'The icon in the Tabs.',
    tabBar: 'The Tabs tab bar.',
    tabPane: 'The Tabs tab pane.',
    inkBar: 'The Tabs ink bar.',
  },
  events: {
    onChange: 'Trigger action on tab change.',
    onTabScroll: 'Trigger action on tab scroll.',
    onTabClick: 'Trigger action on tab click.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      animated: {
        type: 'boolean',
        default: true,
        description:
          'Whether to change tabs with animation. Only works while tabPlacement is top or bottom.',
      },
      defaultActiveKey: {
        type: 'string',
        description: "Initial active TabPane's key, if activeKey is not set.",
      },
      size: {
        type: 'string',
        default: 'default',
        enum: ['default', 'small', 'large'],
        description: 'Size of the tabs.',
      },
      tabPlacement: {
        type: 'string',
        default: 'top',
        enum: ['top', 'right', 'bottom', 'left'],
        description: 'Position of the tabs.',
      },
      tabType: {
        type: 'string',
        default: 'line',
        enum: ['line', 'card'],
        description: 'Type of tabs.',
      },
      tabs: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key'],
          properties: {
            title: {
              type: 'string',
              description: 'Title of the tab - supports html.',
            },
            key: {
              type: 'string',
              description: 'Area key of the tab.',
            },
            disabled: {
              type: 'boolean',
              default: false,
              description: 'Disable the tab if true.',
            },
            icon: {
              type: ['string', 'object'],
              description:
                "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to show in tab title.",
              docs: {
                displayType: 'icon',
              },
            },
            shortcut: {
              type: 'string',
              description: 'Keyboard shortcut to switch to this tab. Use "mod" for Cmd/Ctrl.',
            },
          },
        },
      },
      tabBarStyle: {
        type: 'object',
        description: 'Css style to apply to the tab bar.',
        docs: {
          displayType: 'yaml',
        },
      },
      extraAreaKey: {
        type: 'string',
        description: 'Area key for the extra area blocks.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/tabs#design-token',
        },
        properties: {
          cardBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color of card-type tab.',
          },
          cardGutter: {
            type: 'number',
            default: 2,
            description: 'Gap between card-type tabs.',
          },
          cardHeight: {
            type: 'number',
            default: 40,
            description: 'Height of card-type tab.',
          },
          cardPadding: {
            type: 'string',
            default: '8px 16px',
            description: 'Padding of card-type tab.',
          },
          cardPaddingLG: {
            type: 'string',
            default: '11px 16px',
            description: 'Padding of large card-type tab.',
          },
          cardPaddingSM: {
            type: 'string',
            default: '4px 8px',
            description: 'Padding of small card-type tab.',
          },
          horizontalItemGutter: {
            type: 'number',
            default: 32,
            description: 'Gap between horizontal tabs.',
          },
          horizontalItemMargin: {
            type: 'string',
            description: 'Horizontal margin of tab item.',
          },
          horizontalItemPadding: {
            type: 'string',
            default: '12px 0',
            description: 'Padding of horizontal tab item.',
          },
          horizontalItemPaddingLG: {
            type: 'string',
            default: '16px 0',
            description: 'Padding of large horizontal tab item.',
          },
          horizontalItemPaddingSM: {
            type: 'string',
            default: '8px 0',
            description: 'Padding of small horizontal tab item.',
          },
          horizontalMargin: {
            type: 'string',
            default: '0 0 16px 0',
            description: 'Margin of horizontal tab bar.',
          },
          inkBarColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Color of the active tab indicator bar.',
          },
          itemActiveColor: {
            type: 'string',
            default: '#0958d9',
            description: 'Text color of active (mousedown) tab.',
          },
          itemColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color of tab.',
          },
          itemHoverColor: {
            type: 'string',
            default: '#4096ff',
            description: 'Text color of hovered tab.',
          },
          itemSelectedColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Text color of selected tab.',
          },
          titleFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of tab title.',
          },
          titleFontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size of large tab title.',
          },
          titleFontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size of small tab title.',
          },
          verticalItemMargin: {
            type: 'string',
            default: '16px 0 0 0',
            description: 'Margin of vertical tab item.',
          },
          verticalItemPadding: {
            type: 'string',
            default: '8px 24px',
            description: 'Padding of vertical tab item.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of tab dropdown popup.',
          },
        },
      },
    },
  },
};
