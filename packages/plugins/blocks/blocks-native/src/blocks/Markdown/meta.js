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

import iconSchema from '../../schemas/icon.js';
import toneSchema from '../../schemas/tone.js';

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Markdown element.',
  },
  events: {
    onLinkPress: {
      description:
        'Trigger action when any link is pressed, link chips included, instead of opening it. Without this event a web (http or https) link opens in the in-app browser, any other link (mailto:, tel:) through the system, and link chips are not pressable. Mobile only.',
      event: {
        href: 'The href of the pressed link, as written in the markdown (`pelican:PEL-12` for a chip).',
      },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      content: {
        type: 'string',
        description: 'Content in markdown format.',
        docs: {
          displayType: 'text-area',
        },
      },
      linkChips: {
        type: 'array',
        description:
          'Links drawn as inline chips rather than text, by their address scheme: `[PEL-12 Sign in](pelican:PEL-12)` with a `pelican` chip is a rounded pill with the icon, the key (`PEL-12`, the part of the text the address names) in medium weight in the tone, and the title after it in the label colour, cut short with an ellipsis to the block width. Link text that does not start with the address value is all key, after the prefix. Mobile only.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['scheme'],
          properties: {
            scheme: {
              type: 'string',
              description: 'The address scheme, without the colon: `pelican` for `pelican:PEL-12`.',
            },
            icon: {
              ...iconSchema,
              description: 'The icon at the start of the chip. ' + iconSchema.description,
            },
            tone: {
              ...toneSchema,
              description:
                "The chip colour: 'primary' (the app's tint), 'danger', 'warning', 'success', 'info' or 'neutral' (grey, the key in the label colour). The chip is a soft tint of it.",
            },
            color: {
              type: 'string',
              description:
                'A colour in place of tone: a palette hue (`blue`, `teal`, `purple`), a token name or a hex colour.',
            },
            prefix: {
              type: 'string',
              description:
                'Text put before link text that does not start with it, such as `@` for a mention.',
            },
          },
        },
      },
      skipHtml: {
        type: 'boolean',
        default: false,
        description:
          'By default, HTML in markdown is escaped. When true all HTML code in the markdown will not be rendered.',
      },
    },
  },
};
