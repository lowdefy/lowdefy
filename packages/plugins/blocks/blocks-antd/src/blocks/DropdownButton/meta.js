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
    element: 'The outer container.',
    button: 'The trigger button.',
    icon: 'The icon in the button.',
    menu: 'The floating menu container.',
    item: 'Individual menu items.',
    itemIcon: 'Icon within menu items.',
    arrow: 'Dropdown arrow indicator.',
  },
  events: {
    onClick: 'Trigger action when the button is clicked (split mode).',
    onOpenChange: 'Trigger action when dropdown opens or closes.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'Button label text.',
      },
      icon: {
        type: ['string', 'object'],
        description: 'Name of a React-Icon or properties of an Icon block to use icon in button.',
        docs: {
          displayType: 'icon',
        },
      },
      type: {
        type: 'string',
        enum: ['primary', 'default', 'dashed', 'text', 'link'],
        default: 'default',
        description: 'Deprecated - use color and variant instead. The button type.',
      },
      color: {
        type: 'string',
        description:
          'Button color. Preset values: default, primary, danger, blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue, lime, gold. Also accepts custom hex color strings.',
        docs: {
          displayType: 'color',
        },
      },
      variant: {
        type: 'string',
        enum: ['solid', 'outlined', 'dashed', 'filled', 'text', 'link'],
        description: 'Button visual variant. When set, takes precedence over type.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        default: 'middle',
        description: 'Button size.',
      },
      shape: {
        type: 'string',
        enum: ['circle', 'round', 'square'],
        default: 'square',
        description: 'Shape of the button.',
      },
      danger: {
        type: 'boolean',
        default: false,
        description: 'Set button style to danger.',
      },
      ghost: {
        type: 'boolean',
        default: false,
        description: "Make the button's background transparent.",
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the entire dropdown.',
      },
      trigger: {
        type: 'string',
        enum: ['click', 'hover'],
        default: 'click',
        description: 'How the dropdown opens.',
      },
      placement: {
        type: 'string',
        enum: ['bottomLeft', 'bottom', 'bottomRight', 'topLeft', 'top', 'topRight'],
        default: 'bottomRight',
        description: 'Dropdown position.',
      },
      arrow: {
        anyOf: [
          { type: 'boolean' },
          { type: 'object', properties: { pointAtCenter: { type: 'boolean' } } },
        ],
        default: false,
        description: 'Show arrow pointing to trigger.',
        docs: {
          displayType: 'switch',
        },
      },
      split: {
        type: 'boolean',
        default: false,
        description: 'Split button mode. Left button fires onClick, right arrow opens dropdown.',
      },
      items: {
        type: 'array',
        description: 'Menu items. Each with an eventName that triggers a named event.',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Display text.',
            },
            eventName: {
              type: 'string',
              description: 'Event name to trigger when clicked.',
            },
            icon: {
              type: ['string', 'object'],
              description: 'Icon name or config.',
              docs: {
                displayType: 'icon',
              },
            },
            danger: {
              type: 'boolean',
              description: 'Red danger styling.',
            },
            disabled: {
              type: 'boolean',
              description: 'Disable this item.',
            },
            type: {
              type: 'string',
              enum: ['divider'],
              description: 'Set to divider for a separator.',
            },
            shortcut: {
              type: 'string',
              description: 'Keyboard shortcut. Binds the key and renders the badge.',
            },
          },
        },
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides. Top-level keys apply to the Dropdown menu. Use the nested "button" key for Button-specific tokens. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/dropdown#design-token',
        },
        properties: {
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the dropdown popup.',
          },
          controlItemBgHover: {
            type: 'string',
            description: 'Background color on menu item hover.',
          },
          borderRadiusLG: {
            type: 'number',
            description: 'Border radius for the dropdown menu.',
          },
          paddingBlock: {
            type: 'number',
            description: 'Vertical padding for menu items.',
          },
          button: {
            type: 'object',
            description:
              'Button component token overrides. See <a href="https://ant.design/components/button#design-token">Button design tokens</a>.',
            docs: {
              displayType: 'yaml',
              link: 'https://ant.design/components/button#design-token',
            },
            properties: {
              borderRadius: {
                type: 'number',
                default: 6,
                description: 'Border radius of the button.',
              },
              borderRadiusLG: {
                type: 'number',
                default: 8,
                description: 'Border radius for large buttons.',
              },
              borderRadiusSM: {
                type: 'number',
                default: 4,
                description: 'Border radius for small buttons.',
              },
              controlHeight: {
                type: 'number',
                default: 32,
                description: 'Height of the button.',
              },
              controlHeightLG: {
                type: 'number',
                default: 40,
                description: 'Height for large buttons.',
              },
              controlHeightSM: {
                type: 'number',
                default: 24,
                description: 'Height for small buttons.',
              },
              fontSize: {
                type: 'number',
                default: 14,
                description: 'Font size.',
              },
              paddingInline: {
                type: 'number',
                default: 15,
                description: 'Horizontal padding.',
              },
              paddingBlock: {
                type: 'number',
                default: 0,
                description: 'Vertical padding.',
              },
              colorPrimary: {
                type: 'string',
                description: 'Primary color override.',
              },
              colorPrimaryHover: {
                type: 'string',
                description: 'Primary hover color.',
              },
              colorPrimaryActive: {
                type: 'string',
                description: 'Primary active color.',
              },
              colorBgContainer: {
                type: 'string',
                description: 'Background color for default buttons.',
              },
              colorText: {
                type: 'string',
                description: 'Text color for default buttons.',
              },
              colorBorder: {
                type: 'string',
                description: 'Border color for outlined and dashed buttons.',
              },
            },
          },
        },
      },
    },
  },
};
