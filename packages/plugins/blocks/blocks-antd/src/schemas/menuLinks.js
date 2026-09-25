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

import icon from './icon.js';

export default {
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'type'],
    properties: {
      id: {
        type: 'string',
        description: 'Menu item id.',
      },
      pageId: {
        type: 'string',
        description: 'Page to link to.',
      },
      properties: {
        type: 'object',
        description: 'properties from menu item.',
        properties: {
          title: {
            type: 'string',
            description: 'Menu item title.',
          },
          icon: {
            ...icon,
            description:
              "Icon name (a semantic name like edit, or a <a href='https://react-icons.github.io/react-icons/'>React Icons</a> name like LuPencil) or properties of an Icon block to customize icon on menu item.",
          },
        },
      },
    },
  },
};
