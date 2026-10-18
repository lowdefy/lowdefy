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

import avatar from '../../schemas/avatar.js';
import icon from '../../schemas/icon.js';
import { theme } from '../../schemas/inputProperties.js';
import status from '../../schemas/status.js';
import tone from '../../schemas/tone.js';

const sizedAvatar = {
  ...avatar,
  properties: {
    ...avatar.properties,
    size: { type: 'number', description: 'The avatar diameter in points.' },
  },
};

const swipeAction = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', description: 'Passed to onSwipeAction as `_event: id`.' },
    title: { type: 'string', description: 'The button title.' },
    icon,
    tone,
    color: {
      type: 'string',
      description: 'The button colour in place of its tone: a palette hue, token name or colour.',
      docs: { displayType: 'color' },
    },
  },
};

// A mobile-only block: an iOS-style list row. On a phone a table is a List of ListItems.
export default {
  category: 'container',
  icons: ['chevron-right'],
  valueType: null,
  slots: {
    leading: 'Blocks at the start of the row, in place of the leading property.',
    trailing: 'Blocks at the end of the row, before the trailing property parts.',
  },
  cssKeys: {
    element: 'The ListItem row.',
    avatar: 'The leading avatar.',
    icon: 'The leading icon.',
    title: 'The title.',
    subtitle: 'The subtitle.',
    description: 'The subtitle (the phase 1 name).',
    extra: 'The trailing text.',
  },
  events: {
    onClick: 'Trigger actions when the row is pressed. The row then shows a chevron.',
    onSwipeAction:
      'Trigger actions when a swipe action is pressed or fully swiped, with the action id as `_event: id`.',
    onContextMenu:
      'Trigger actions when a context menu item is picked, with the item id as `_event: id`.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      avatar: {
        ...avatar,
        description: 'The same as leading.avatar.',
      },
      chevron: {
        type: 'boolean',
        description:
          'Show a chevron at the end of the row. Defaults to true when the row has an onClick event.',
      },
      contextMenu: {
        type: 'array',
        description:
          "Items of the menu a long press opens: iOS's native context menu, or an alert on Android. Picking one fires onContextMenu.",
        items: {
          type: 'object',
          required: ['id', 'title'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', description: 'Passed to onContextMenu as `_event: id`.' },
            title: { type: 'string', description: 'The item title.' },
            icon: {
              type: ['string', 'object'],
              description:
                'An SF Symbol name (doc.on.doc, trash), or { sf, name }. A native menu cannot draw Lucide icons, so a Lucide name shows no icon.',
              properties: {
                sf: { type: 'string', description: 'The SF Symbol name.' },
                name: { type: 'string', description: 'An icon name.' },
              },
            },
            destructive: {
              type: 'boolean',
              default: false,
              description: 'Draw the item in red, for an action that deletes or removes.',
            },
          },
        },
      },
      description: {
        type: 'string',
        description: 'The same as subtitle.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Dim the row and stop it from being pressed.',
      },
      extra: {
        type: 'string',
        description: 'The same as trailing.text.',
      },
      icon: {
        ...icon,
        description: 'The same as leading.icon.',
      },
      leading: {
        type: 'object',
        additionalProperties: false,
        description:
          'What starts the row: a status glyph, an avatar or an icon. With more than one, status wins, then avatar.',
        properties: {
          avatar: {
            ...sizedAvatar,
            description: "A person's avatar, 40pt with a subtitle and 28pt without.",
          },
          icon: {
            ...icon,
            description: 'An icon, drawn at 22pt in the secondary label colour.',
          },
          status: {
            ...status,
            description:
              'A StatusIcon glyph (inProgress, done, dot, ...), or { name, color, size }.',
          },
        },
      },
      subtitle: {
        type: 'string',
        description: 'One line of meta under the title, such as `PEL-644 · Design title`.',
      },
      subtitleLines: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'The most lines the subtitle takes before it is cut short.',
      },
      swipeActions: {
        type: 'object',
        additionalProperties: false,
        description:
          'Buttons the row shows when it is swiped: leading ones when swiped right, trailing ones when swiped left. The first of each side sits at the edge. Each fires onSwipeAction with its id.',
        properties: {
          leading: { type: 'array', items: swipeAction, description: 'Shown when swiped right.' },
          trailing: { type: 'array', items: swipeAction, description: 'Shown when swiped left.' },
          fullSwipe: {
            type: 'string',
            enum: ['leading', 'trailing', 'both', 'none'],
            default: 'leading',
            description:
              "The sides on which swiping most of the way across runs the side's first action, as Mail's swipe to mark read.",
          },
        },
      },
      theme,
      title: {
        type: 'string',
        description: 'The row title.',
      },
      titleLines: {
        type: 'integer',
        minimum: 1,
        default: 2,
        description: 'The most lines the title takes before it is cut short.',
      },
      trailing: {
        type: 'object',
        additionalProperties: false,
        description:
          'What ends the row, in this order: badges, text, a status glyph, an icon, then avatars.',
        properties: {
          avatar: { ...sizedAvatar, description: "A person's avatar, 20pt unless sized." },
          avatars: {
            type: 'array',
            items: avatar,
            description: 'Several people as stacked 20pt avatars, at most three and a count.',
          },
          badges: {
            type: 'array',
            description:
              'Small counts with an icon, such as open questions: [{ icon: questionmark.circle, text: 2 }].',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                icon,
                text: { type: ['string', 'number'], description: 'The count or short text.' },
                color: {
                  type: 'string',
                  description: 'The badge colour: a palette hue, token name or colour.',
                },
              },
            },
          },
          icon: { ...icon, description: 'An icon in the secondary label colour.' },
          status: {
            ...status,
            description: 'A StatusIcon glyph, such as the priority (priorityHigh).',
          },
          text: { type: 'string', description: 'Meta text, such as a time (2d) or a value.' },
          textColor: {
            type: 'string',
            description:
              'The text colour, such as orange for "waiting": a palette hue, token name or colour.',
          },
        },
      },
    },
  },
};
