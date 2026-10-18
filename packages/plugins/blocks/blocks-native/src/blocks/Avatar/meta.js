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
import { theme } from '../../schemas/inputProperties.js';

// A mobile-only block: a person's initials avatar, or several stacked.
export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The avatar, or the stack of avatars.',
  },
  events: {},
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...avatar.properties,
      avatars: {
        type: 'array',
        description:
          'Several people, drawn as overlapping avatars, the first on top. Overrides name, src, content and color.',
        items: avatar,
      },
      max: {
        type: 'integer',
        minimum: 1,
        description: 'With avatars: the most to draw. A "+n" circle counts the rest.',
      },
      ringColor: {
        type: 'string',
        description:
          'With avatars: the ring around each avatar, which should match the surface behind them. Defaults to the cell colour.',
        docs: { displayType: 'color' },
      },
      size: {
        type: 'number',
        default: 28,
        minimum: 12,
        description:
          'The avatar diameter in points: 20 in a row, 28 in a comment, 40 for a person row.',
      },
      theme,
    },
  },
};
