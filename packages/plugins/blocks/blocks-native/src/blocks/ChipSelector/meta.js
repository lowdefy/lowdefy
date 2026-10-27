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
import { disabled, theme } from '../../schemas/inputProperties.js';

const color = {
  description:
    "The option's colour: a palette hue (`blue`, `teal`, `amber`, ...), a token name (`colorSuccess`) or a hex colour, drawn as a tile with a white icon and a soft tint when selected; or `{ fg, bg, fgDark, bgDark }`, a mark drawn fg on bg (the icon tile, and the selected chip's fill, border and label), with the dark variants in dark mode.",
  oneOf: [
    { type: 'string', docs: { displayType: 'color' } },
    {
      type: 'object',
      additionalProperties: false,
      required: ['fg'],
      properties: {
        fg: {
          type: 'string',
          description: 'The mark colour: the icon, and the selected label and border.',
          docs: { displayType: 'color' },
        },
        bg: {
          type: 'string',
          description:
            'The tint behind it: the icon tile, and the selected fill. Defaults to fg at about 15%.',
          docs: { displayType: 'color' },
        },
        fgDark: {
          type: 'string',
          description: 'fg in dark mode. Defaults to fg.',
          docs: { displayType: 'color' },
        },
        bgDark: {
          type: 'string',
          description: 'bg in dark mode. Defaults to a soft tint of the dark fg.',
          docs: { displayType: 'color' },
        },
      },
    },
  ],
};

// A mobile-only input: a scrolling strip of chips that picks one option.
export default {
  category: 'input',
  icons: [],
  valueType: 'string',
  cssKeys: {
    element: 'The chip strip.',
    chip: 'Each chip.',
    label: 'Each chip label.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when a chip is picked.',
      event: { value: 'The value of the picked option.' },
    },
    onMore:
      'Trigger actions when the more chip (`moreChip`) is pressed, for example to open a Sheet of every option.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      disabled,
      fadeColor: {
        type: 'string',
        description:
          "The surface behind the strip, which its edges fade into. Defaults to the grouped background, the screen behind a Screen's headerBottom.",
        docs: { displayType: 'color' },
      },
      moreChip: {
        type: 'object',
        additionalProperties: false,
        description:
          'A trailing chip after the options, such as "All spaces", that fires `onMore` instead of picking a value.',
        properties: {
          label: { type: 'string', description: 'The chip label.' },
          icon: { ...icon, description: `Drawn plain before the label. ${icon.description}` },
        },
      },
      options: {
        type: 'array',
        description: 'The chips, in order.',
        items: {
          type: 'object',
          required: ['value'],
          additionalProperties: false,
          properties: {
            value: { type: 'string', description: 'The value the chip sets.' },
            label: { type: 'string', description: 'The chip label. Defaults to the value.' },
            icon: {
              ...icon,
              description: `Drawn in a rounded-square tile of the option's colour. ${icon.description}`,
            },
            color,
            badge: {
              type: ['string', 'number'],
              description: 'A count or short text after the label, such as open items.',
            },
            disabled: {
              type: 'boolean',
              default: false,
              description: 'Draw the chip dimmed and ignore presses.',
            },
          },
        },
      },
      theme,
      title: {
        type: 'string',
        description: 'The label screen readers read for the strip. Not drawn.',
      },
    },
  },
};
