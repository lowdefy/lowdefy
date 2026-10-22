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

const linkTarget = {
  pageId: { type: 'string', description: 'Page to link to.' },
  url: { type: 'string', urlKind: 'url', description: 'External URL to link to.' },
  urlQuery: { type: 'object', description: 'Query parameters for the link.' },
  newTab: { type: 'boolean', description: 'Open link in new tab.' },
};

const badge = {
  description:
    'A number, or `{ count, tone, dot }`. Tone is `default` or `error`; `dot` shows a dot with no number. A count of 0 shows nothing.',
  docs: { displayType: 'yaml' },
};

const mark = {
  type: 'object',
  description:
    'What marks the crumb or option: `{ percent, color }` draws a progress ring (a score), `{ src }` an image, `{ icon, color }` an icon on a tint, `{ text, color }` up to two letters on a tint.',
  additionalProperties: false,
  properties: {
    text: { type: 'string', description: 'Up to two letters on a tint.' },
    color: {
      type: 'string',
      description: 'Tint, or the ring colour with percent.',
      docs: { displayType: 'color' },
    },
    src: { type: 'string', urlKind: 'src', description: 'Image URL.' },
    icon: { ...icon, description: 'Icon on a tint.' },
    percent: { type: 'number', description: 'Draw a progress ring filled to this percent.' },
  },
};

export default {
  category: 'container',
  actions: ['SetDarkMode'],
  operators: ['_event'],
  icons: [
    'bell',
    'user',
    'more',
    'check',
    'close',
    'search',
    'chevron-down',
    'sidebar-collapse',
    'sidebar-expand',
    'theme-light',
    'theme-dark',
    'theme-system',
  ],
  valueType: null,
  slots: {
    content: 'Main page content.',
    panel:
      "The page's own menu or list, in the panel beside the rail. The panel is shown when this slot has blocks.",
    panelHeader:
      'Content at the top of the panel, such as a title, filters or a search box. It stays in place while the panel scrolls.',
    header: "The page's actions, at the right of the bar.",
    aside:
      'Content of the right dock, shown while `aside.open` is true. On a desktop the content narrows to make room; on a tablet or phone it slides over the content.',
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
    bar: 'The bar above the panel and the content.',
    crumbs: 'The breadcrumb in the bar.',
    header: 'The box at the right of the bar that holds the header slot.',
    panel: 'The panel beside the rail; a drawer on a tablet or phone.',
    panelHeader: 'The box at the top of the panel that holds the panelHeader slot.',
    panelBody: 'The scrolling box that holds the panel slot.',
    resizeHandle: 'The draggable right edge of the panel.',
    main: 'The content.',
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
    onNotificationsClick: 'Trigger action when the notifications item is clicked.',
    onProfileMenuClick: {
      description: 'Trigger action when a profile menu item is clicked.',
      event: {
        key: 'The menu item key (id).',
        keyPath: 'The key path of the menu item.',
        pageId: 'The page id of the menu item.',
        url: 'The url of the menu item.',
      },
    },
    onProfileMenuOpen: {
      description: 'Trigger action when the profile menu opens or closes.',
      event: { open: 'Whether the menu is open.' },
    },
    onSwitch: {
      description:
        'Trigger action when an option is picked in a switcher crumb. An option with a page or url also navigates.',
      event: {
        crumbId: 'The crumb id.',
        optionId: 'The option id.',
        pageId: "The option's page id.",
        url: "The option's url.",
      },
    },
    onSwitcherAction: {
      description: "Trigger action when one of a switcher crumb's actions is picked.",
      event: { crumbId: 'The crumb id.', actionId: 'The action id.' },
    },
    onCrumbClick: {
      description: 'Trigger action when a crumb that links to a page is clicked.',
      event: { id: 'The crumb id.' },
    },
    onPanelToggle: {
      description: 'Trigger action when the panel opens or closes.',
      event: {
        open: 'Whether the panel is now open.',
        mode: '`desktop`, `tablet` or `phone`.',
        source:
          'What opened or closed it: `button`, `rail`, `shortcut`, `drag`, `keyboard`, `swipe`, `scrim`, `escape`, `navigate` or `method`.',
      },
    },
    onPanelResize: {
      description: 'Trigger action when the panel width is set, on drag end or a key press.',
      event: { width: 'The new panel width in pixels.' },
    },
    onAsideClose: 'Trigger action when the scrim behind the aside is tapped on a tablet or phone.',
  },
  methods: {
    openPanel: 'Open the panel, or the panel drawer on a tablet or phone.',
    closePanel: 'Close the panel.',
    togglePanel: 'Open the panel when it is closed and close it when it is open.',
    toggleDarkMode: 'Toggle dark mode.',
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
          'Antd global design token overrides, such as colorPrimary or borderRadius, applied to everything in the page layout. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>. The rail, bar and panel colours and sizes are CSS variables, listed on this block\'s documentation page.',
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
          alt: {
            type: 'string',
            description: 'Accessible name of the logo link. Defaults to Home.',
          },
        },
      },
      menu: {
        type: 'object',
        description:
          "The places in the rail, each an icon over a short label. A MenuGroup or MenuDivider is not supported: the panel is where a place's pages go. Clicking the place whose page is open toggles its panel.",
        properties: {
          links: {
            ...menuLinks,
            description:
              "Menu links. Compatible with `_menu` operator output. A link's `properties.tip` is added to its hover tip, and `properties.shortcut` (such as `g c` or `mod+1`) opens it from the keyboard.",
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
          'Badges on places, keyed by menu link id: a number, or `{ count, tone, dot }`. Count what needs someone, not totals, so an empty badge means nothing is waiting.',
        docs: { displayType: 'yaml' },
      },
      footItems: {
        type: 'array',
        description:
          'Items at the foot of the rail, above notifications and the profile, such as search or an assistant. One with a pageId or url is a link; one without triggers `onFootItemClick`.',
        items: {
          type: 'object',
          required: ['id', 'title'],
          properties: {
            id: { type: 'string', description: 'Foot item id.' },
            icon: { ...icon, description: 'Icon for the foot item.' },
            title: { type: 'string', description: 'Short label under the icon.' },
            tip: { type: 'string', description: 'Extra text in the hover tip.' },
            shortcut: {
              type: 'string',
              description: 'Keyboard shortcut shown in the hover tip, such as `mod+k`.',
            },
            badge,
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
          title: { type: 'string', default: 'Alerts', description: 'Label under the bell.' },
          tip: { type: 'string', description: 'Extra text in the hover tip.' },
          link: {
            type: 'object',
            description: 'Link to navigate to when the item is clicked.',
            additionalProperties: false,
            properties: linkTarget,
          },
          count: { type: 'number', description: 'Number to display on the badge.' },
          dot: { type: 'boolean', default: false, description: 'Show a dot instead of a count.' },
          tone: {
            type: 'string',
            enum: ['default', 'error'],
            default: 'error',
            description: 'Badge colour.',
          },
          overflowCount: {
            type: 'number',
            default: 99,
            description: 'Max count to show. Values above this display as "N+".',
          },
          icon: { ...icon, description: 'Icon for the item. Defaults to `bell`.' },
        },
      },
      profile: {
        type: 'object',
        description:
          'Profile avatar at the foot of the rail, with its menu. Renders when configured. Use with the `_user` operator to fill it from the signed-in user.',
        additionalProperties: false,
        properties: {
          title: { type: 'string', default: 'Account', description: 'Label under the avatar.' },
          name: { type: 'string', description: "The person's name, at the top of the menu." },
          email: { type: 'string', description: "The person's email, under their name." },
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
              'Menu items. Uses the same MenuLink/MenuGroup/MenuDivider schema as Menu. On a phone they are listed in the More sheet.',
          },
        },
      },
      darkModeToggle: {
        type: 'boolean',
        default: false,
        description:
          'Add a dark mode item to the profile menu. The preference is persisted to localStorage.',
      },
      crumbs: {
        type: 'array',
        description:
          'The breadcrumb in the bar. Lead with switcher crumbs (an organisation, a workspace, a filter that applies to every page), then the trail to the current page. On a phone the last switcher becomes a pill that opens a sheet with every switcher, and the last crumb is the title.',
        items: {
          type: 'object',
          required: ['id', 'label'],
          properties: {
            id: { type: 'string', description: 'Crumb id.' },
            label: { type: 'string', description: 'Crumb text.' },
            icon: { ...icon, description: 'Icon before the text, when there is no mark.' },
            mark,
            ...linkTarget,
            switcher: {
              type: 'object',
              description:
                'Makes the crumb a switcher: clicking it opens a list of options, filtered once there are enough of them.',
              additionalProperties: false,
              properties: {
                title: { type: 'string', description: 'Heading over the list.' },
                placeholder: { type: 'string', description: 'Placeholder of the filter box.' },
                filterFrom: {
                  type: 'integer',
                  default: 6,
                  description: 'Show the filter box from this many options.',
                },
                empty: { type: 'string', description: 'Text when the filter matches nothing.' },
                ariaLabel: { type: 'string', description: 'Accessible name of the crumb button.' },
                options: {
                  type: 'array',
                  description:
                    'The options. One with a pageId or url navigates; every pick triggers `onSwitch`.',
                  items: {
                    type: 'object',
                    required: ['id', 'label'],
                    properties: {
                      id: { type: 'string', description: 'Option id.' },
                      label: { type: 'string', description: 'Option text.' },
                      description: { type: 'string', description: 'Second line.' },
                      extra: {
                        type: ['string', 'number'],
                        description: 'Short text or count at the right, such as what waits there.',
                      },
                      selected: { type: 'boolean', description: 'Tick this option as current.' },
                      mark,
                      ...linkTarget,
                    },
                  },
                },
                actions: {
                  type: 'array',
                  description:
                    'Rows under the options, such as "New organisation". One with a pageId or url navigates; every pick triggers `onSwitcherAction`.',
                  items: {
                    type: 'object',
                    required: ['id', 'label'],
                    properties: {
                      id: { type: 'string', description: 'Action id.' },
                      label: { type: 'string', description: 'Action text.' },
                      icon: { ...icon, description: 'Action icon.' },
                      ...linkTarget,
                    },
                  },
                },
              },
            },
          },
        },
      },
      panel: {
        type: 'object',
        description:
          'The panel beside the rail, filled by the `panel` slot. On a desktop people drag its edge to resize it and collapse it; the width and collapse are kept in localStorage, shared by every page of the app. On a tablet or phone it is a drawer over the content.',
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            description: "The panel's accessible name, and its heading in the drawer.",
          },
          minWidth: { type: 'integer', default: 240, description: 'Smallest width in pixels.' },
          maxWidth: { type: 'integer', default: 480, description: 'Largest width in pixels.' },
          initialWidth: {
            type: 'integer',
            default: 300,
            description:
              'Width before the person has resized the panel, and after a double-click on its edge.',
          },
          storageKey: {
            type: 'string',
            default: 'rail-panel',
            description: "localStorage key suffix. Produces key 'lf-{storageKey}', kept per app.",
          },
          shortcut: {
            type: ['string', 'null'],
            default: 'mod+\\',
            description: 'Keyboard shortcut that opens and closes the panel. Null turns it off.',
          },
          startOpen: {
            type: 'boolean',
            default: false,
            description:
              'Open the drawer when the page opens on a tablet or phone, such as a list page with nothing picked yet.',
          },
          closeOnNavigate: {
            type: 'boolean',
            default: true,
            description: 'Close the drawer when a link inside it is followed.',
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
      headerOnPhone: {
        type: 'boolean',
        default: false,
        description:
          "Keep the header slot in the bar on a phone. Off by default: a phone's bar has room for the switcher pill and the title only, so put a page's phone actions in its content.",
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
            description: 'Show the dock.',
          },
          width: { type: 'integer', default: 400, description: 'Width in pixels.' },
          title: { type: 'string', description: "The dock's accessible name." },
        },
      },
      padding: {
        type: 'string',
        enum: ['default', 'compact', 'none'],
        default: 'default',
        description:
          'Space around the content. `compact` tightens it to 16px. `none` removes it so content such as a table runs edge to edge.',
      },
    },
  },
};
