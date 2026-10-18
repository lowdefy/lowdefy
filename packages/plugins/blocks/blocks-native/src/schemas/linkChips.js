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

// The `linkChips` of a block that draws markdown: links drawn as inline chips by their scheme.
export default {
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
};
