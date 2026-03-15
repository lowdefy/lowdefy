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

export default {
  category: 'container',
  icons: [...MobileMenuMeta.icons],
  valueType: null,
  slots: ['content', 'footer', 'header'],
  cssKeys: {
    element: 'The PageHeaderMenu element.',
    header: 'The PageHeaderMenu header.',
    logo: 'The PageHeaderMenu logo.',
    menu: 'The PageHeaderMenu menu.',
    content: 'The PageHeaderMenu content.',
    breadcrumb: 'The PageHeaderMenu breadcrumb.',
    footer: 'The PageHeaderMenu footer.',
  },
  events: {
    onBreadcrumbClick: 'Trigger action when a breadcrumb item is clicked.',
    onClose: 'Trigger action when mobile menu is closed.',
    onMenuItemClick: 'Trigger action when menu item is clicked.',
    onMenuItemSelect: 'Trigger action when menu item is selected.',
    onOpen: 'Trigger action when mobile menu is open.',
    onToggleDrawer: 'Trigger action when mobile menu drawer is toggled.',
    onToggleMenuGroup: 'Trigger action when mobile menu group is opened.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      logo: {
        type: 'object',
        description: 'Header logo settings.',
        additionalProperties: false,
        properties: {
          src: {
            type: 'string',
            description: 'Header logo source url.',
          },
          srcMobile: {
            type: 'string',
            description: 'Header logo img element for mobile.',
          },
          breakpoint: {
            type: 'number',
            description: 'Header logo breakpoint for switching between mobile and desktop logo.',
          },
          alt: {
            type: 'string',
            default: 'Lowdefy',
            description: 'Header logo alternative text.',
          },
          style: {
            type: 'object',
            description: 'Css style object to apply to logo.',
            docs: {
              displayType: 'yaml',
            },
          },
        },
      },
      header: {
        type: 'object',
        description: 'Header properties.',
        additionalProperties: false,
        properties: {
          theme: {
            type: 'string',
            enum: ['light', 'dark'],
            default: 'dark',
            description: 'Header theme color.',
          },
          contentStyle: {
            type: 'object',
            description: 'Header content css style object.',
            docs: {
              displayType: 'yaml',
            },
          },
          style: {
            type: 'object',
            description: 'Header css style object.',
            docs: {
              displayType: 'yaml',
            },
          },
        },
      },
      footer: {
        type: 'object',
        description: 'Footer properties.',
        additionalProperties: false,
        properties: {
          style: {
            type: 'object',
            description: 'Footer css style object.',
            docs: {
              displayType: 'yaml',
            },
          },
        },
      },
      content: {
        type: 'object',
        description: 'Content properties.',
        additionalProperties: false,
        properties: {
          style: {
            type: 'object',
            description: 'Content css style object.',
            docs: {
              displayType: 'yaml',
            },
          },
        },
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
          list: {
            type: 'array',
            description: 'List of breadcrumb links.',
            items: {
              type: 'string',
              description: 'Title of the breadcrumb link.',
            },
          },
        },
      },
      menu: {
        type: 'object',
        description: 'Menu properties.',
        properties: {
          theme: {
            type: 'string',
            enum: ['dark', 'light'],
            default: 'dark',
            description: 'Color theme of menu.',
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
                    icon: {
                      type: ['string', 'object'],
                      description:
                        "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on menu item.",
                      docs: {
                        displayType: 'icon',
                      },
                    },
                  },
                },
              },
            },
          },
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
