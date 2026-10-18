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

// Empty has no web block of its name: it is antd's Empty, for a list or screen with nothing to
// show. A page that uses it is mobile only.
export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    footer: 'Blocks under the description, such as a button that creates the first item.',
  },
  cssKeys: {
    element: 'The Empty element.',
    image: 'The image above the description.',
    description: 'The description text.',
    footer: 'The footer under the description.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      description: {
        type: 'string',
        default: 'No data',
        description: 'Text under the image. Set to an empty string to show the image alone.',
      },
      icon: {
        ...icon,
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to show in place of the image.',
      },
      image: {
        type: 'string',
        enum: ['default', 'simple'],
        default: 'default',
        description:
          'The empty tray image: `default` for a screen or card, `simple` (smaller) for inside a list or form.',
      },
    },
  },
};
