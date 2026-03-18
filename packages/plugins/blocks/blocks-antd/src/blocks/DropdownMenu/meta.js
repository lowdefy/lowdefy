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
  slots: ['content'],
  cssKeys: {
    element: 'The trigger wrapper element.',
    menu: 'The floating menu container.',
    item: 'Individual menu items.',
    itemIcon: 'Icon within menu items.',
    subMenu: 'Submenu/group containers.',
    arrow: 'Dropdown arrow indicator.',
  },
  events: {
    onClick: {
      description: 'Trigger action when a menu item is clicked.',
      event: {
        key: 'The menu item key.',
        keyPath: 'The key path of the menu item.',
        pageId: 'The page id of the menu item.',
        url: 'The url of the menu item.',
      },
    },
    onSelect: {
      description: 'Trigger action when a menu item is selected.',
      event: {
        key: 'The selected menu item key.',
        selectedKeys: 'All selected menu item keys.',
        pageId: 'The page id of the selected item.',
        url: 'The url of the selected item.',
      },
    },
    onOpenChange: {
      description: 'Trigger action when dropdown opens or closes.',
      event: { open: 'Whether the dropdown is open.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      links: {
        type: 'array',
        description: 'Menu items. Same structure as Menu block: MenuLink, MenuGroup, MenuDivider.',
        items: {
          type: 'object',
          required: ['id', 'type'],
          properties: {
            id: {
              type: 'string',
              description: 'Menu item id.',
            },
            type: {
              type: 'string',
              enum: ['MenuDivider', 'MenuLink', 'MenuGroup'],
              default: 'MenuLink',
              description: 'Menu item type.',
            },
            pageId: {
              type: 'string',
              description: 'Page to link to.',
            },
            url: {
              type: 'string',
              description: 'External URL to link to.',
            },
            newTab: {
              type: 'boolean',
              description: 'Open link in new tab.',
            },
            style: {
              type: 'object',
              description: 'Css style applied to the link.',
              docs: {
                displayType: 'yaml',
              },
            },
            properties: {
              type: 'object',
              description: 'Properties for the menu item.',
              properties: {
                title: {
                  type: 'string',
                  description: 'Menu item title.',
                },
                icon: {
                  type: ['string', 'object'],
                  description:
                    'Name of a React-Icon or properties of an Icon block to customize icon on menu item.',
                  docs: {
                    displayType: 'icon',
                  },
                },
                danger: {
                  type: 'boolean',
                  default: false,
                  description: 'Apply danger style to menu item.',
                },
                disabled: {
                  type: 'boolean',
                  default: false,
                  description: 'Disable the menu item.',
                },
                dashed: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether the divider line is dashed.',
                },
                shortcut: {
                  type: 'string',
                  description:
                    'Keyboard shortcut to select this menu item. Use "mod" for Cmd/Ctrl.',
                },
              },
            },
            links: {
              type: 'array',
              description: 'Nested menu items for MenuGroup.',
              items: {
                type: 'object',
                required: ['id', 'type'],
                properties: {
                  id: { type: 'string', description: 'Menu item id.' },
                  type: {
                    type: 'string',
                    enum: ['MenuDivider', 'MenuLink'],
                    default: 'MenuLink',
                    description: 'Menu item type.',
                  },
                  pageId: { type: 'string', description: 'Page to link to.' },
                  url: { type: 'string', description: 'External URL to link to.' },
                  newTab: { type: 'boolean', description: 'Open link in new tab.' },
                  style: {
                    type: 'object',
                    description: 'Css style applied to the link.',
                    docs: { displayType: 'yaml' },
                  },
                  properties: {
                    type: 'object',
                    description: 'Properties for the menu item.',
                    properties: {
                      title: { type: 'string', description: 'Menu item title.' },
                      icon: {
                        type: ['string', 'object'],
                        description: 'Icon name or config.',
                        docs: { displayType: 'icon' },
                      },
                      danger: { type: 'boolean', default: false, description: 'Danger style.' },
                      disabled: {
                        type: 'boolean',
                        default: false,
                        description: 'Disable the item.',
                      },
                      dashed: {
                        type: 'boolean',
                        default: false,
                        description: 'Dashed divider line.',
                      },
                      shortcut: {
                        type: 'string',
                        description: 'Keyboard shortcut. Use "mod" for Cmd/Ctrl.',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      trigger: {
        type: 'string',
        enum: ['click', 'hover', 'contextMenu'],
        default: 'hover',
        description: 'How the dropdown opens.',
      },
      placement: {
        type: 'string',
        enum: ['bottomLeft', 'bottom', 'bottomRight', 'topLeft', 'top', 'topRight'],
        default: 'bottomLeft',
        description: 'Position relative to trigger.',
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
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the dropdown.',
      },
      destroyOnClose: {
        type: 'boolean',
        default: false,
        description: 'Unmount menu DOM when closed.',
      },
      selectedKeys: {
        type: 'array',
        description: 'Highlighted menu items.',
        items: {
          type: 'string',
        },
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
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
            description: 'Background color on item hover.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override.',
          },
          borderRadiusLG: {
            type: 'number',
            description: 'Border radius for the dropdown.',
          },
          paddingBlock: {
            type: 'number',
            description: 'Vertical padding for menu items.',
          },
        },
      },
    },
  },
};
