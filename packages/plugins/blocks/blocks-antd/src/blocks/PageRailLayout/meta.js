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
import menuLinks from '../../schemas/menuLinks.js';
import breadcrumbList from '../../schemas/breadcrumbList.js';

const linkTarget = {
  pageId: { type: 'string', description: 'Page to link to.' },
  url: { type: 'string', urlKind: 'url', description: 'External URL to link to.' },
  newTab: { type: 'boolean', description: 'Open link in new tab.' },
};

export default {
  category: 'container',
  actions: ['SetDarkMode'],
  operators: ['_event'],
  icons: [
    'bell',
    'user',
    'more',
    'sidebar-expand',
    'theme-light',
    'theme-dark',
    'theme-system',
    'chevron-right',
  ],
  valueType: null,
  slots: {
    content: 'Main page content.',
    contentHeader:
      'Content of the 52px row above the content, beside the breadcrumb. It lines up with the panel header.',
    panel:
      "The page's own menu or list, in the resizable panel beside the rail. The panel is shown when this slot has blocks.",
    panelHeader:
      'Content above the panel, such as an organisation switcher. It stays in place while the panel scrolls.',
    aside:
      'Content of the right dock, shown while `aside.open` is true. The content narrows to make room.',
    mobileHeader: 'Content above the panel on a phone.',
  },
  cssKeys: {
    element: 'The PageRailLayout element.',
    rail: 'The rail.',
    railFoot: 'The foot of the rail, which holds the foot items, notifications and profile.',
    logo: 'The logo image at the top of the rail.',
    notifications: 'The notifications item.',
    profile: 'The profile item.',
    profileAvatar: 'The profile avatar.',
    profileMenu: 'The profile dropdown menu popup.',
    panel: 'The panel beside the rail. On a phone, the section above the content.',
    panelHeader: 'The box above the panel that holds the panelHeader slot.',
    panelBody: 'The scrolling box that holds the panel slot.',
    resizeHandle: 'The draggable right edge of the panel.',
    drawer: 'The body of the panel drawer shown on a tablet.',
    main: 'The column that holds the content header and the content.',
    contentHeader: 'The row above the content.',
    breadcrumb: 'The breadcrumb in the content header.',
    content: 'The content.',
    aside: 'The right dock.',
    tabBar: 'The bottom tab bar shown on a phone.',
    moreSheet: "The sheet the tab bar's More item opens.",
  },
  events: {
    onMenuItemClick: {
      description: 'Trigger action when a place in the rail or tab bar is clicked.',
      event: {
        key: "The place's page id, or its id when it has no page.",
        keyPath: 'The key path of the place.',
        index: 'The position of the place in the menu.',
      },
    },
    onFootItemClick: {
      description: 'Trigger action when a foot item without a page or url is clicked.',
      event: { id: 'The foot item id.' },
    },
    onPanelResize: {
      description: 'Trigger action when the panel width is set, on drag end or an arrow key.',
      event: { width: 'The new panel width in pixels.' },
    },
    onPanelDrawerToggle: {
      description: 'Trigger action when the panel drawer opens or closes on a tablet.',
      event: { open: 'Whether the drawer is open.' },
    },
    onNotificationsClick: 'Trigger action when the notifications item is clicked.',
    onBreadcrumbClick: 'Trigger action when a breadcrumb item is clicked.',
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
      title: {
        type: 'string',
        description: 'Page title. Accepted for compatibility.',
      },
      theme: {
        type: 'object',
        description:
          'Antd global design token overrides, such as colorPrimary or borderRadius, applied to everything in the page layout. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>. The size and colour of the rail itself are CSS variables, listed on this block\'s documentation page.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/docs/react/customize-theme#seedtoken',
        },
      },
      logo: {
        type: 'object',
        description: 'Logo mark at the top of the rail. Links to the home page.',
        additionalProperties: false,
        properties: {
          src: { type: 'string', urlKind: 'src', description: 'Logo image URL.' },
          alt: { type: 'string', description: 'Logo alternative text.' },
        },
      },
      menu: {
        type: 'object',
        description:
          "The places in the rail, each an icon over a short label. A MenuGroup or MenuDivider is not supported: the panel is where a place's pages go.",
        properties: {
          links: {
            ...menuLinks,
            description:
              "Menu links. Compatible with `_menu` operator output. A link's `properties.tip` is shown in its hover tip.",
          },
          menuId: {
            type: 'string',
            default: 'default',
            description: 'Id of the app menu to use when `links` is not given.',
          },
          selectedKeys: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Keys (page ids) of the places to show as active. Defaults to the current page.',
          },
        },
      },
      badges: {
        type: 'object',
        description:
          'Badges on places, keyed by menu link id. A value is a number, or `{ count, tone }` where tone is `default` or `error`. A count of 0 shows no badge.',
        docs: { displayType: 'yaml' },
      },
      footItems: {
        type: 'array',
        description:
          'Items at the foot of the rail, above notifications and the profile. One with a pageId or url is a link; one without triggers `onFootItemClick`.',
        items: {
          type: 'object',
          required: ['id', 'title'],
          properties: {
            id: { type: 'string', description: 'Foot item id.' },
            icon: { ...icon, description: 'Icon for the foot item.' },
            title: { type: 'string', description: 'Short label under the icon.' },
            tip: { type: 'string', description: 'Extra text in the hover tip.' },
            badge: {
              description: 'A number, or `{ count, tone }`.',
              docs: { displayType: 'yaml' },
            },
            ...linkTarget,
          },
        },
      },
      notifications: {
        type: 'object',
        description:
          'Notifications item with a count badge, after the foot items. Renders when configured. Triggers `onNotificationsClick`, and navigates when `link` is given.',
        additionalProperties: false,
        properties: {
          title: { type: 'string', default: 'Notifications', description: 'Label under the bell.' },
          tip: { type: 'string', description: 'Extra text in the hover tip.' },
          link: {
            type: 'object',
            description: 'Link to navigate to when the item is clicked.',
            additionalProperties: false,
            properties: linkTarget,
          },
          count: { type: 'number', description: 'Number to display on the badge.' },
          dot: { type: 'boolean', default: false, description: 'Show a dot instead of a count.' },
          showZero: { type: 'boolean', default: false, description: 'Show the badge at zero.' },
          overflowCount: {
            type: 'number',
            default: 99,
            description: 'Max count to show. Values above this display as "N+".',
          },
          color: {
            type: 'string',
            description: 'Badge color.',
            docs: { displayType: 'color' },
          },
          icon: { ...icon, description: 'Icon for the item. Defaults to `bell`.' },
        },
      },
      profile: {
        type: 'object',
        description:
          'Profile avatar at the foot of the rail, with an optional dropdown menu. Renders when configured. Use with the `_user` operator to fill it from the signed-in user.',
        additionalProperties: false,
        properties: {
          title: { type: 'string', default: 'Profile', description: 'Label under the avatar.' },
          avatar: {
            type: 'object',
            description: 'Avatar display properties.',
            additionalProperties: false,
            properties: {
              src: { type: 'string', urlKind: 'src', description: 'Image URL for the avatar.' },
              content: {
                type: 'string',
                description: 'Text inside the avatar, such as initials, when there is no src.',
              },
              icon: { ...icon, description: 'Icon when there is no src or content.' },
              color: {
                type: 'string',
                description: 'Background color when not using src.',
                docs: { displayType: 'color' },
              },
              size: {
                type: ['string', 'number'],
                default: 24,
                description: 'Size of the avatar: default, small, large or a pixel number.',
                docs: { displayType: 'string' },
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
            ...menuLinks,
            description:
              'Dropdown menu items. Uses the same MenuLink/MenuGroup/MenuDivider schema as Menu.',
          },
        },
      },
      darkModeToggle: {
        type: 'boolean',
        default: false,
        description:
          'Add a dark mode item to the profile menu. Toggles the Ant Design dark theme for the page. The preference is persisted to localStorage.',
      },
      panel: {
        type: 'object',
        description:
          'The resizable panel beside the rail, filled by the `panel` slot. Its width is stored in localStorage and shared by every page of the app.',
        additionalProperties: false,
        properties: {
          minWidth: { type: 'integer', default: 240, description: 'Smallest width in pixels.' },
          maxWidth: { type: 'integer', default: 480, description: 'Largest width in pixels.' },
          initialWidth: {
            type: 'integer',
            default: 300,
            description: 'Width in pixels before the person has dragged the panel.',
          },
          storageKey: {
            type: 'string',
            default: 'rail-panel-width',
            description:
              "localStorage key suffix for the width. Produces key 'lf-{storageKey}', kept per app.",
          },
          drawerBreakpoint: {
            type: 'integer',
            default: 1100,
            description:
              'Below this screen width in pixels the panel becomes a drawer over the content.',
          },
        },
      },
      mobileBreakpoint: {
        type: 'integer',
        default: 768,
        description: 'Below this screen width in pixels the rail becomes a bottom tab bar.',
      },
      mobileTabs: {
        type: 'integer',
        default: 4,
        description:
          'How many places the phone tab bar shows before More, which holds the rest, the foot items, notifications and the profile menu.',
      },
      aside: {
        type: 'object',
        description: 'The right dock, filled by the `aside` slot.',
        additionalProperties: false,
        properties: {
          open: {
            type: 'boolean',
            default: false,
            description: 'Show the dock. The content narrows rather than being covered.',
          },
          width: { type: 'integer', default: 400, description: 'Width in pixels.' },
        },
      },
      padding: {
        type: 'string',
        enum: ['default', 'compact', 'none'],
        default: 'default',
        description:
          'Space around the content. `compact` tightens it to 16px. `none` removes it so content such as a table runs edge to edge.',
      },
      breadcrumb: {
        type: 'object',
        description: 'Breadcrumb shown in the content header.',
        properties: {
          separator: {
            type: 'string',
            default: '/',
            description: 'Use a custom separator string.',
          },
          list: breadcrumbList,
        },
      },
    },
  },
};
