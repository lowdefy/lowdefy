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
import { theme } from '../../schemas/inputProperties.js';
import status from '../../schemas/status.js';
import tone from '../../schemas/tone.js';

const count = {
  type: ['number', 'string'],
  description: 'A count shown after the title. Defaults to the number of items with showCount.',
};

export default {
  category: 'list',
  icons: [],
  valueType: 'array',
  slots: {
    content: 'Blocks rendered for each list item.',
  },
  cssKeys: {
    element: 'The List.',
    cell: "Each item's row: a cell of its section in an inset grouped List.",
    sectionHeader: 'The section headers.',
    sectionFooter: 'The section footers.',
  },
  events: {
    onRefresh:
      'Mobile only. Trigger actions when the List is pulled down to refresh. The refresh spinner shows while they run. Needs scroll: true.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      direction: {
        type: 'string',
        enum: ['row', 'column', 'row-reverse', 'column-reverse'],
        description: "List items along a 'row' or down a 'column'.",
      },
      header: {
        type: ['string', 'object'],
        description:
          "Mobile only. The title of the List's one section, when there is no sectionKey: a string, or { title, count, status, footer }.",
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'The section title.' },
          count,
          status,
          footer: { type: 'string', description: 'Text under the section.' },
        },
      },
      headerVariant: {
        type: 'string',
        enum: ['footnote', 'headline'],
        description:
          "Mobile only. The section header style: 'footnote' (small, upper case, secondary, as iOS settings) or 'headline' (17pt semibold). Defaults to footnote for insetGrouped and headline for plain.",
      },
      scroll: {
        type: 'boolean',
        description:
          'Let the List scroll itself, in place of scrolling with the page. Give it a height in its style.',
      },
      sectionKey: {
        type: 'string',
        description:
          "Mobile only. The path in each item of its section's key. Without sections, items with the same key next to each other form a section titled by the key. With sections, every item joins its key's section.",
      },
      sections: {
        type: 'array',
        description:
          'Mobile only. With sectionKey: the sections in the order to show them, with their titles, counts, glyphs and footers. Items are grouped by key whatever their order in the list. Keys not listed follow in the order they appear, titled by the key. Sections with no items are hidden.',
        items: {
          type: 'object',
          required: ['key'],
          additionalProperties: false,
          properties: {
            key: {
              type: ['string', 'number', 'boolean'],
              description: 'The sectionKey value of the items in this section.',
            },
            title: {
              type: 'string',
              description: 'The section title. A section without one has no header.',
            },
            count,
            status: {
              ...status,
              description:
                'A status glyph or stage dot before the title: a StatusIcon name, or { name, color }.',
            },
            footer: { type: 'string', description: 'Text under the section.' },
          },
        },
      },
      showCount: {
        type: 'boolean',
        default: false,
        description: "Mobile only. Show each section's number of items after its title.",
      },
      stickyHeaders: {
        type: 'boolean',
        description:
          'Mobile only. Keep the section header at the top while its section scrolls under it. Defaults to true for plain and false for insetGrouped. Needs scroll: true.',
      },
      swipeActions: {
        type: 'array',
        description:
          'Mobile only. Buttons an item shows when it is swiped to the left. Each fires the List event it names, with the item index as `_event: index`. For actions on one row, use the ListItem swipeActions.',
        items: {
          type: 'object',
          required: ['title', 'event'],
          additionalProperties: false,
          properties: {
            title: { type: 'string', description: 'The button title.' },
            event: {
              type: 'string',
              description: 'The name of the List event the button fires, such as onDelete.',
            },
            color: {
              type: 'string',
              description: 'The button colour. Defaults to the primary colour.',
            },
            danger: {
              type: 'boolean',
              default: false,
              description: "Draw the button in the danger colour. The same as tone: 'danger'.",
            },
            icon,
            tone,
          },
        },
      },
      theme,
      variant: {
        type: 'string',
        enum: ['insetGrouped', 'plain'],
        default: 'insetGrouped',
        description:
          "Mobile only. 'insetGrouped' draws each section as a rounded group of cells, inset from the screen edges on the grouped background. 'plain' draws edge to edge rows with sticky section headers. A row List is always plain.",
      },
      wrap: {
        type: 'string',
        enum: ['wrap', 'nowrap', 'wrap-reverse'],
        nativeIgnored: true,
        description: 'Ignored on mobile: list items do not wrap.',
      },
    },
  },
};
