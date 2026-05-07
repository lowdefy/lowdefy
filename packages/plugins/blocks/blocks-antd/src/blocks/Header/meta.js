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

import icon from '../../schemas/icon.js';

export default {
  category: 'container',
  icons: ['AiOutlineBell', 'AiOutlineLaptop', 'AiOutlineMoon', 'AiOutlineSun', 'AiOutlineUser'],
  valueType: null,
  slots: {
    content: 'Child blocks in the header.',
  },
  cssKeys: {
    element: 'The Header element.',
    headerActions: 'The header actions container (notifications, profile, dark mode toggle).',
    notifications: 'The notification bell wrapper.',
    notificationsBadge: 'The notification badge.',
    notificationsIcon: 'The notification bell icon.',
    profile: 'The profile avatar and dropdown wrapper.',
    profileAvatar: 'The profile avatar element.',
    profileMenu: 'The profile dropdown menu popup.',
    darkModeToggle: 'The dark mode toggle wrapper.',
  },
  events: {
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
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      color: {
        type: 'string',
        description:
          'Header background color. Accepts any CSS color value. Defaults to the antd container background color (light in light mode, dark in dark mode).',
        docs: {
          displayType: 'color',
        },
      },
      iconsColor: {
        type: 'string',
        description:
          'Color for the notification, profile, and dark mode toggle icons. Use when the header has a dark background color.',
        docs: {
          displayType: 'color',
        },
      },
      notifications: {
        type: 'object',
        description:
          'Notification bell icon with badge in the header. Renders when configured. Use the link property to navigate when clicked.',
        additionalProperties: false,
        properties: {
          link: {
            type: 'object',
            description: 'Link to navigate to when the notification bell is clicked.',
            additionalProperties: false,
            properties: {
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
            },
          },
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
            default: 'hover',
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
          'Show a dark mode toggle icon in the header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage.',
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
