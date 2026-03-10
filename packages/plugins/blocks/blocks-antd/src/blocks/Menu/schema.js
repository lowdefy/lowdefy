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
      expandIcon: {
        type: ['string', 'object'],
        description: 'Menu expand icon.',
        docs: {
          displayType: 'icon',
        },
      },
      menuId: {
        type: 'string',
        description: 'App menu id used to get menu links.',
      },
      mode: {
        type: 'string',
        enum: ['vertical', 'horizontal', 'inline'],
        default: 'vertical',
        description: 'Type of menu to render.',
      },
      selectedKeys: {
        type: 'array',
        description: 'Array with the keys of currently selected menu items.',
        items: {
          type: 'string',
          description: "A menu item 'id' to be displayed as selected.",
        },
      },
      defaultOpenKeys: {
        type: 'array',
        description: 'Array with the keys of default opened sub menus.',
        items: {
          type: 'string',
          description: "A menu item 'id' which should be open by default.",
        },
      },
      collapsed: {
        type: 'boolean',
        default: false,
        description: 'Collapse the inline menu.',
      },
      inlineIndent: {
        type: 'number',
        default: 24,
        description: 'Indent width for each sub menu level in pixels (inline mode only).',
      },
      forceSubMenuRender: {
        type: 'boolean',
        description: 'Render submenu into DOM before it becomes visible.',
        default: false,
      },
      subMenuCloseDelay: {
        type: 'number',
        description: 'Delay time to hide submenu when mouse leaves (in seconds).',
      },
      subMenuOpenDelay: {
        type: 'number',
        description: 'Delay time to show submenu when mouse enters (in seconds).',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/menu#design-token',
        },
        properties: {
          dropdownWidth: {
            type: 'number',
            default: 160,
            description: 'Width of dropdown submenus.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index for popup submenus.',
          },
          itemBorderRadius: {
            type: 'number',
            default: 8,
            description: 'Border radius for menu items.',
          },
          subMenuItemBorderRadius: {
            type: 'number',
            default: 4,
            description: 'Border radius for submenu items.',
          },
          itemColor: {
            type: 'string',
            description: 'Text color of menu items.',
          },
          itemHoverColor: {
            type: 'string',
            description: 'Text color when hovering menu items.',
          },
          horizontalItemHoverColor: {
            type: 'string',
            description: 'Text color when hovering horizontal menu items.',
          },
          itemSelectedColor: {
            type: 'string',
            description: 'Text color of selected menu items.',
          },
          horizontalItemSelectedColor: {
            type: 'string',
            description: 'Text color of selected horizontal menu items.',
          },
          itemDisabledColor: {
            type: 'string',
            description: 'Text color of disabled menu items.',
          },
          dangerItemColor: {
            type: 'string',
            description: 'Text color of danger menu items.',
          },
          dangerItemHoverColor: {
            type: 'string',
            description: 'Text color when hovering danger items.',
          },
          dangerItemSelectedColor: {
            type: 'string',
            description: 'Text color of selected danger items.',
          },
          dangerItemSelectedBg: {
            type: 'string',
            description: 'Background color of selected danger items.',
          },
          dangerItemActiveBg: {
            type: 'string',
            description: 'Background color of active danger items.',
          },
          itemBg: {
            type: 'string',
            description: 'Background color of menu items.',
          },
          itemHoverBg: {
            type: 'string',
            description: 'Background color when hovering menu items.',
          },
          subMenuItemBg: {
            type: 'string',
            description: 'Background color of submenu items.',
          },
          itemActiveBg: {
            type: 'string',
            description: 'Background color of active menu items.',
          },
          itemSelectedBg: {
            type: 'string',
            description: 'Background color of selected menu items.',
          },
          horizontalItemSelectedBg: {
            type: 'string',
            description: 'Background color of selected horizontal items.',
          },
          horizontalItemHoverBg: {
            type: 'string',
            description: 'Background color of hovered horizontal items.',
          },
          horizontalItemBorderRadius: {
            type: 'number',
            default: 0,
            description: 'Border radius for horizontal menu items.',
          },
          activeBarWidth: {
            type: 'number',
            default: 0,
            description: 'Width of active indicator bar.',
          },
          activeBarHeight: {
            type: 'number',
            default: 2,
            description: 'Height of active indicator bar.',
          },
          activeBarBorderWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of active indicator bar.',
          },
          itemHeight: {
            type: 'number',
            default: 40,
            description: 'Height of menu items.',
          },
          itemMarginInline: {
            type: 'number',
            default: 4,
            description: 'Horizontal margin between items.',
          },
          itemMarginBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical margin between items.',
          },
          itemPaddingInline: {
            type: 'number',
            default: 16,
            description: 'Horizontal padding of menu items.',
          },
          collapsedWidth: {
            type: 'number',
            default: 80,
            description: 'Width of collapsed inline menu.',
          },
          popupBg: {
            type: 'string',
            description: 'Background color of popup submenus.',
          },
          groupTitleColor: {
            type: 'string',
            description: 'Text color of group titles.',
          },
          groupTitleFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of group titles.',
          },
          iconSize: {
            type: 'number',
            default: 14,
            description: 'Icon size in menu items.',
          },
          iconMarginInlineEnd: {
            type: 'number',
            default: 10,
            description: 'Margin after icon in menu items.',
          },
          collapsedIconSize: {
            type: 'number',
            default: 16,
            description: 'Icon size in collapsed menu.',
          },
          darkItemColor: {
            type: 'string',
            description: 'Text color in dark theme.',
          },
          darkItemBg: {
            type: 'string',
            default: '#001529',
            description: 'Background color in dark theme.',
          },
          darkSubMenuItemBg: {
            type: 'string',
            default: '#000c17',
            description: 'Submenu background in dark theme.',
          },
          darkItemSelectedColor: {
            type: 'string',
            description: 'Selected item text color in dark theme.',
          },
          darkItemSelectedBg: {
            type: 'string',
            description: 'Selected item background in dark theme.',
          },
          darkItemHoverBg: {
            type: 'string',
            description: 'Hover background in dark theme.',
          },
          darkItemHoverColor: {
            type: 'string',
            description: 'Hover text color in dark theme.',
          },
          darkGroupTitleColor: {
            type: 'string',
            description: 'Group title color in dark theme.',
          },
          darkItemDisabledColor: {
            type: 'string',
            description: 'Disabled item color in dark theme.',
          },
          darkPopupBg: {
            type: 'string',
            default: '#001529',
            description: 'Popup background in dark theme.',
          },
          darkDangerItemColor: {
            type: 'string',
            description: 'Danger item color in dark theme.',
          },
          darkDangerItemSelectedBg: {
            type: 'string',
            description: 'Selected danger item background in dark theme.',
          },
          darkDangerItemHoverColor: {
            type: 'string',
            description: 'Hover danger item color in dark theme.',
          },
          darkDangerItemSelectedColor: {
            type: 'string',
            description: 'Selected danger item text color in dark theme.',
          },
          darkDangerItemActiveBg: {
            type: 'string',
            description: 'Active danger item background in dark theme.',
          },
        },
      },
      links: {
        type: 'array',
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
            style: {
              type: 'object',
              description: 'Css style to applied to link.',
              docs: {
                displayType: 'yaml',
              },
            },
            properties: {
              type: 'object',
              description: 'properties from menu item.',
              properties: {
                title: {
                  type: 'string',
                  description: 'Menu item title.',
                },
                icon: {
                  type: ['string', 'object'],
                  description:
                    "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on menu item.",
                  docs: {
                    displayType: 'icon',
                  },
                },
                danger: {
                  type: 'boolean',
                  default: false,
                  description: 'Apply danger style to menu item.',
                },
                dashed: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether the divider line is dashed.',
                },
              },
            },
            links: {
              type: 'array',
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
                  style: {
                    type: 'object',
                    description: 'Css style to applied to sub-link.',
                    docs: {
                      displayType: 'yaml',
                    },
                  },
                  pageId: {
                    type: 'string',
                    description: 'Page to link to.',
                  },
                  properties: {
                    type: 'object',
                    description: 'properties from menu item.',
                    properties: {
                      title: {
                        type: 'string',
                        description: 'Menu item title.',
                      },
                      danger: {
                        type: 'boolean',
                        default: false,
                        description: 'Apply danger style to menu item.',
                      },
                      dashed: {
                        type: 'boolean',
                        default: false,
                        description: 'Whether the divider line is dashed.',
                      },
                    },
                    links: {
                      type: 'array',
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
                            enum: ['MenuDivider', 'MenuLink'],
                            default: 'MenuLink',
                            description: 'Menu item type.',
                          },
                          style: {
                            type: 'object',
                            description: 'Css style to applied to sub-link.',
                            docs: {
                              displayType: 'yaml',
                            },
                          },
                          pageId: {
                            type: 'string',
                            description: 'Page to link to.',
                          },
                          properties: {
                            type: 'object',
                            description: 'properties from menu item.',
                            properties: {
                              title: {
                                type: 'string',
                                description: 'Menu item title.',
                              },
                              danger: {
                                type: 'boolean',
                                default: false,
                                description: 'Apply danger style to menu item.',
                              },
                              dashed: {
                                type: 'boolean',
                                default: false,
                                description: 'Whether the divider line is dashed.',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onSelect: {
        type: 'array',
        description: 'Trigger action when menu item is selected.',
      },
      onClick: {
        type: 'array',
        description: 'Trigger action when menu item is clicked.',
      },
      onToggleMenuGroup: {
        type: 'array',
        description: 'Trigger action when mobile menu group is opened.',
      },
    },
  },
  cssKeys: ['element', 'item'],
};

export default schema;
