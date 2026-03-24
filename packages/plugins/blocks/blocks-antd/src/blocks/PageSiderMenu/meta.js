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

import MobileMenuMeta from '../MobileMenu/meta.js';
import icon from '../../schemas/icon.js';
import menuLinks from '../../schemas/menuLinks.js';
import breadcrumbList from '../../schemas/breadcrumbList.js';

export default {
  category: 'container',
  icons: [
    'AiOutlineBell',
    'AiOutlineMenuFold',
    'AiOutlineMenuUnfold',
    'AiOutlineMoon',
    'AiOutlineSun',
    'AiOutlineUser',
    ...MobileMenuMeta.icons,
  ],
  valueType: null,
  slots: {
    content: 'Main page content.',
    footer: 'Page footer.',
    header: 'Additional header content.',
    sider: 'Sider content below the menu.',
  },
  cssKeys: {
    element: 'The PageSiderMenu element.',
    header: 'The PageSiderMenu header.',
    headerActions: 'The header actions container (notifications, profile, dark mode toggle).',
    headerContent: 'The PageSiderMenu header content area.',
    logo: 'The PageSiderMenu logo.',
    notifications: 'The notification bell button.',
    notificationsBadge: 'The notification badge wrapper.',
    notificationsIcon: 'The notification bell icon.',
    profile: 'The profile avatar and dropdown wrapper.',
    profileAvatar: 'The profile avatar element.',
    profileMenu: 'The profile dropdown menu popup.',
    darkModeToggle: 'The PageSiderMenu dark mode toggle button.',
    mobileMenu: 'The PageSiderMenu mobile menu.',
    layout: 'The PageSiderMenu inner layout.',
    sider: 'The PageSiderMenu sider.',
    menu: 'The PageSiderMenu menu.',
    content: 'The PageSiderMenu content.',
    breadcrumb: 'The PageSiderMenu breadcrumb.',
    footer: 'The PageSiderMenu footer.',
  },
  events: {
    onBreadcrumbClick: 'Trigger action when a breadcrumb item is clicked.',
    onChangeToggleSiderAffix:
      'Trigger action when sider collapse button affix triggers a onChange event.',
    onClose: 'Trigger action when menu is closed.',
    onMenuItemSelect: 'Trigger action when menu item is selected.',
    onMenuItemClick: 'Trigger action when menu item is clicked.',
    onNotificationClick: 'Trigger action when the notification bell is clicked.',
    onOpen: 'Trigger action when menu is open.',
    onProfileClick:
      'Trigger action when the profile avatar is clicked (when no links are configured).',
    onProfileMenuClick: {
      description: 'Trigger action when a profile dropdown menu item is clicked.',
      event: {
        key: 'The menu item key (id).',
        keyPath: 'The key path of the menu item.',
        pageId: 'The page id of the menu item.',
        url: 'The url of the menu item.',
      },
    },
    onProfileMenuOpen: {
      description: 'Trigger action when the profile dropdown opens or closes.',
      event: { open: 'Whether the dropdown is open.' },
    },
    onToggleDrawer: 'Trigger action when mobile menu drawer is toggled.',
    onToggleMenuGroup: 'Trigger action when mobile menu group is opened.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      logo: {
        type: 'object',
        description:
          'Header logo settings. By default, images are served from the app public folder and auto-swap between light and dark variants based on dark mode. See <a href="/hosting-files">Hosting Files</a> for details.',
        additionalProperties: false,
        properties: {
          src: {
            type: 'string',
            description:
              'Logo image URL for desktop. Defaults to logo-light-theme.png or logo-dark-theme.png from the public folder (~250x72px), auto-selected based on dark mode.',
          },
          srcMobile: {
            type: 'string',
            description:
              'Logo image URL for mobile. Defaults to logo-square-light-theme.png or logo-square-dark-theme.png from the public folder (~125x125px), auto-selected based on dark mode.',
          },
          breakpoint: {
            type: 'number',
            description:
              'Viewport width breakpoint (in px) for switching between mobile and desktop logo. Default is 577.',
          },
          alt: {
            type: 'string',
            default: 'Lowdefy',
            description: 'Logo image alt text.',
          },
        },
      },
      header: {
        type: 'object',
        description: 'Header properties.',
        additionalProperties: false,
        properties: {},
      },
      sider: {
        type: 'object',
        description: 'Sider properties.',
        additionalProperties: false,
        properties: {
          breakpoint: {
            type: 'string',
            enum: ['xs', 'sm', 'md', 'lg', 'xl'],
            default: 'sm',
            description: 'Breakpoint of the responsive layout.',
          },
          collapsedWidth: {
            type: 'integer',
            description:
              'Width of the collapsed sidebar, by setting to 0 a special trigger will appear.',
          },
          collapsible: {
            type: 'boolean',
            default: true,
            description: 'Whether can be collapsed.',
          },
          initialCollapsed: {
            type: 'boolean',
            default: true,
            description: 'Set the initial collapsed state.',
          },
          reverseArrow: {
            type: 'boolean',
            default: false,
            description: 'Direction of arrow, for a sider that expands from the right.',
          },
          width: {
            type: ['string', 'number'],
            description: 'Width of the sidebar.',
            docs: {
              displayType: 'string',
            },
          },
          hideToggleButton: {
            type: 'boolean',
            description: 'Hide toggle button in sider.',
            default: false,
          },
        },
      },
      toggleSiderButton: {
        type: 'object',
        description: 'Toggle sider button properties.',
        docs: {
          displayType: 'button',
        },
      },
      footer: {
        type: 'object',
        description: 'Footer properties.',
        additionalProperties: false,
        properties: {},
      },
      content: {
        type: 'object',
        description: 'Content properties.',
        additionalProperties: false,
        properties: {},
      },
      breadcrumb: {
        type: 'object',
        description: 'Breadcrumb properties.',
        properties: {
          separator: {
            type: 'string',
            default: '/',
            description: 'Use a custom separator string.',
          },
          list: breadcrumbList,
        },
      },
      menu: {
        type: 'object',
        description: 'Menu properties.',
        properties: {
          links: menuLinks,
        },
      },
      menuLg: {
        type: 'object',
        description:
          'Menu large screen properties. Overwrites menu properties on desktop screen sizes.',
        docs: {
          displayType: 'yaml',
        },
      },
      menuMd: {
        type: 'object',
        description: 'Mobile menu properties. Overwrites menu properties on mobile screen sizes.',
        docs: {
          displayType: 'yaml',
        },
      },
      notifications: {
        type: 'object',
        description:
          'Notification bell icon with badge in the header. Renders when configured. Clicking triggers the onNotificationClick event.',
        additionalProperties: false,
        properties: {
          count: {
            type: 'number',
            description:
              'Number to display on the badge. Set to 0 to hide the badge (unless showZero is true).',
          },
          dot: {
            type: 'boolean',
            default: false,
            description: 'Show a dot instead of a count number.',
          },
          showZero: {
            type: 'boolean',
            default: false,
            description: 'Show badge when count is zero.',
          },
          overflowCount: {
            type: 'number',
            default: 99,
            description: 'Max count to show. Values above this display as "N+".',
          },
          color: {
            type: 'string',
            description: 'Badge color.',
            docs: {
              displayType: 'color',
            },
          },
          icon: {
            ...icon,
            description: 'Icon for the notification button. Defaults to AiOutlineBell.',
          },
          size: {
            type: 'string',
            enum: ['small', 'default', 'large'],
            default: 'small',
            description: 'Size of the notification button.',
          },
        },
      },
      profile: {
        type: 'object',
        description:
          'Profile avatar with optional dropdown menu in the header. Renders when configured. Use with the _user operator to populate from the authenticated user.',
        additionalProperties: false,
        properties: {
          avatar: {
            type: 'object',
            description: 'Avatar display properties.',
            additionalProperties: false,
            properties: {
              src: {
                type: 'string',
                description: 'Image URL for the avatar. Typically bound to _user: image.',
              },
              content: {
                type: 'string',
                description:
                  'Text content inside the avatar (e.g. user initials). Shown when no src is provided.',
              },
              icon: {
                ...icon,
                description:
                  'Icon to display in avatar when no src or content is set. Defaults to AiOutlineUser.',
              },
              color: {
                type: 'string',
                description: 'Background color of the avatar when not using src.',
                docs: {
                  displayType: 'color',
                },
              },
              size: {
                type: ['string', 'number'],
                default: 'small',
                enum: ['default', 'small', 'large'],
                description: 'Size of the avatar.',
                docs: {
                  displayType: 'string',
                },
              },
              shape: {
                type: 'string',
                enum: ['circle', 'square'],
                default: 'circle',
                description: 'Shape of the avatar.',
              },
            },
          },
          links: {
            type: 'array',
            description:
              'Dropdown menu items. Uses the same MenuLink/MenuGroup/MenuDivider pattern as DropdownMenu. When links are provided, clicking the avatar opens a dropdown menu.',
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
                properties: {
                  type: 'object',
                  description: 'Properties for the menu item.',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Menu item title.',
                    },
                    icon: {
                      ...icon,
                      description: 'Icon for the menu item.',
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
                  },
                },
              },
            },
          },
          trigger: {
            type: 'string',
            enum: ['click', 'hover'],
            default: 'click',
            description: 'How the profile dropdown opens.',
          },
          placement: {
            type: 'string',
            enum: ['bottomLeft', 'bottom', 'bottomRight', 'topLeft', 'top', 'topRight'],
            default: 'bottomRight',
            description: 'Dropdown placement relative to the avatar.',
          },
          arrow: {
            anyOf: [
              { type: 'boolean' },
              {
                type: 'object',
                properties: { pointAtCenter: { type: 'boolean' } },
              },
            ],
            default: false,
            description: 'Show arrow on the dropdown.',
            docs: {
              displayType: 'switch',
            },
          },
        },
      },
      darkModeToggle: {
        type: 'boolean',
        default: false,
        description:
          'Show a dark mode toggle button in the header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage.',
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
};
