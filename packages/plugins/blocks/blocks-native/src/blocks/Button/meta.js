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

import { theme } from '../../schemas/inputProperties.js';

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Button.',
    icon: 'The Button icon.',
  },
  events: {
    onClick:
      'Trigger actions when the Button is pressed. The Button shows a spinner while they run.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      block: {
        type: 'boolean',
        default: false,
        description: 'Fill the width of the Button container.',
      },
      color: {
        type: 'string',
        description:
          "The Button colour: 'default', 'primary', 'danger', a preset colour name such as 'blue' or 'green', or any colour. Use with variant.",
      },
      danger: {
        type: 'boolean',
        default: false,
        description: 'Draw the Button in the danger colour.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the Button.',
      },
      ghost: {
        type: 'boolean',
        default: false,
        description: 'Draw the Button with a transparent background and a coloured border.',
      },
      hideTitle: {
        type: 'boolean',
        default: false,
        description: 'Hide the Button title and show only its icon.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          'Name of an icon, or the properties of an Icon block, shown before the title (or after it with `iconPlacement: end`). A Button with an icon and no title shows the icon alone.',
      },
      iconPlacement: {
        type: 'string',
        enum: ['start', 'end'],
        default: 'start',
        description: 'Place the icon before or after the title.',
      },
      shape: {
        type: 'string',
        enum: ['circle', 'round', 'square'],
        default: 'square',
        description:
          'The Button shape. On mobile `square` has rounded corners (10 points at the default size), `round` is a capsule and `circle` an icon button.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'middle', 'large'],
        default: 'default',
        description:
          'The Button size. On mobile `small` is 34 points tall, `default` and `middle` 44 and `large` 50.',
      },
      theme,
      title: {
        type: 'string',
        description:
          'The Button title. Defaults to the block id. Shown as plain text on mobile, where a Button with an icon and no title shows only the icon.',
      },
      tooltip: {
        type: 'string',
        nativeIgnored: true,
        description: 'Ignored on mobile: a phone has no hover.',
      },
      type: {
        type: 'string',
        enum: ['primary', 'default', 'dashed', 'link', 'text', 'danger'],
        default: 'primary',
        description: 'Deprecated, use color and variant. The Button type.',
      },
      variant: {
        type: 'string',
        enum: ['solid', 'outlined', 'dashed', 'filled', 'text', 'link', 'tinted', 'gray', 'plain'],
        description:
          "The Button variant. Use with color. On mobile the variants are the iOS button styles: `solid` is iOS's filled button, `tinted` the colour over a tint of it, `gray` (and `filled`) the colour over the grey fill, and `plain` (and `text`, `link`) the colour alone. `tinted`, `gray` and `plain` are mobile only and take the tint when no color is set.",
      },
    },
  },
};
