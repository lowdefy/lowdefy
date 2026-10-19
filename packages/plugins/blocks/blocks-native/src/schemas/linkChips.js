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

import iconSchema from './icon.js';
import toneSchema from './tone.js';

// The `linkChips` of a block that draws markdown: links drawn as inline chips, matched by their
// address scheme or by a pattern on the address.
export default {
  type: 'array',
  description:
    "Links drawn as inline chips rather than text, matched by their address scheme (`[PEL-12 Sign in](pelican:PEL-12)` with a `pelican` chip) or by a `pattern` on the address (`[ACME-12 (Fix the menu)](/ACME/tasks/ACME-12)` with the pattern `^/ACME/tasks/(?<key>ACME-\\d+)$`). A chip is a rounded pill with the icon, the key (`ACME-12`: the value after the scheme, or the pattern's `key` group) in medium weight in the tone, and the title after it in the label colour, cut short with an ellipsis to the block width. Link text that starts with the key gives the title after it, without the brackets or separator between them; other link text is the title after a pattern's key, and all key after a scheme, after the prefix. The first chip a link matches draws it. Mobile only.",
  items: {
    type: 'object',
    additionalProperties: false,
    anyOf: [{ required: ['scheme'] }, { required: ['pattern'] }],
    not: { required: ['scheme', 'pattern'] },
    errorMessage: {
      anyOf: 'A link chip needs a "scheme" or a "pattern".',
      not: 'A link chip takes a "scheme" or a "pattern", not both.',
    },
    properties: {
      scheme: {
        type: 'string',
        description: 'The address scheme, without the colon: `pelican` for `pelican:PEL-12`.',
      },
      pattern: {
        type: 'string',
        format: 'regex',
        description:
          "A regular expression tested against the link's address as written, in place of a scheme, for links to app paths: `^/ACME/tasks/(?<key>ACME-\\d+)$` matches `/ACME/tasks/ACME-12`. The `key` group, or else the first group, is the chip's key; without a group the link text is the key, as for a scheme.",
      },
      label: {
        type: 'string',
        enum: ['keyAndTitle', 'key', 'text'],
        default: 'keyAndTitle',
        description:
          "What the chip shows: 'keyAndTitle' the key and the title after it, 'key' the key alone, or 'text' the link text as written, all in the key's weight and tone.",
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
};
