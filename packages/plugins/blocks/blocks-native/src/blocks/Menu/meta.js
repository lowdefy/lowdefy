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

// SF Symbols take their own key: the build reads keys ending in "icon" as app icon names.
const symbol = {
  type: 'string',
  description:
    'An SF Symbol name, such as `trash` or `doc.on.doc`, drawn beside the item on iOS. A native menu draws SF Symbols only; Android menus show no item icons.',
};

const avatar = {
  type: 'object',
  description:
    'A person the item stands for. The native menu shows the person symbol in its place when the item has no symbol.',
  properties: {
    name: { type: 'string', description: 'The name the initials are taken from.' },
    src: {
      type: 'string',
      description: 'An image url. Not drawn in the menu, which draws only SF Symbols.',
    },
    color: { type: 'string', description: 'The circle colour. Defaults to one from the name.' },
  },
};

const item = {
  type: 'object',
  required: ['title'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      description: 'The id onSelect passes. Required for items that can be picked.',
    },
    title: { type: 'string', description: 'The item text, or the section title.' },
    symbol,
    avatar,
    checked: {
      type: 'boolean',
      description:
        'Show a checkmark when true. An item with checked false can take one; an item without checked is an action.',
    },
    destructive: {
      type: 'boolean',
      default: false,
      description: 'Draw the item in red, for actions such as Delete.',
    },
    disabled: { type: 'boolean', default: false, description: 'Show the item, dimmed.' },
    hidden: { type: 'boolean', default: false, description: 'Leave the item out.' },
    submenu: {
      type: 'boolean',
      default: false,
      description: 'With items: a nested menu under this item, in place of an inline section.',
    },
    items: {
      type: 'array',
      description:
        'Make this a section of the menu, holding these items under the title (or under a divider when there is no title).',
      items: { type: 'object' },
    },
  },
};

export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content:
      'The trigger: blocks that open the menu when tapped. Give them no onClick of their own. Without blocks, the icon and title are drawn as a button.',
  },
  cssKeys: {
    element: 'The default trigger.',
    icon: 'The default trigger icon.',
    title: 'The default trigger title.',
  },
  events: {
    onSelect: {
      description: 'Trigger actions when a menu item is picked.',
      event: { id: 'The id of the picked item.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      block: {
        type: 'boolean',
        default: false,
        description: 'Stretch the trigger across its container, as for a row.',
      },
      color: {
        type: 'string',
        description: 'The default trigger colour. Defaults to the primary colour.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Dim the trigger and open no menu.',
      },
      icon: {
        ...icon,
        description:
          'The default trigger icon, from the app icon data (a semantic name like `more` or a Lucide name like `Ellipsis`).',
      },
      items: {
        type: 'array',
        description:
          'The menu items, in order: `{ id, title, symbol, checked, destructive, disabled }`, or sections `{ title, items }`.',
        items: item,
      },
      menuTitle: {
        type: 'string',
        description: 'A title at the top of the menu. iOS only.',
      },
      openOn: {
        type: 'string',
        enum: ['press', 'longPress'],
        default: 'press',
        description:
          "'press' opens the menu on a tap; 'longPress' opens it as a context menu on a long press, with a lifted preview of the trigger on iOS.",
      },
      theme: {
        type: 'object',
        description: 'Antd design token overrides for this block, such as colorPrimary.',
      },
      title: {
        type: 'string',
        description: 'The default trigger text.',
      },
    },
  },
};
