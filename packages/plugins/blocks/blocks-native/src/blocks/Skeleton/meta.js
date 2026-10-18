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

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Skeleton element (the box around the rows when it draws rows).',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      avatar: {
        type: 'boolean',
        description:
          'Mobile only. Draw loading rows with a round avatar at the start of each (true, the default for rows) or without (false).',
      },
      count: {
        type: 'integer',
        minimum: 1,
        description:
          'Mobile only. Draw this many loading list rows (3 when `rows` or `avatar` is set), shaped like list rows, in place of one shape.',
      },
      rows: {
        type: 'integer',
        minimum: 1,
        description:
          'Mobile only. The lines of text in each loading row: a title line, then shorter meta lines. Defaults to 2.',
      },
      height: {
        type: ['number', 'string'],
        description: 'Height of the skeleton shape.',
        docs: {
          displayType: 'string',
        },
      },
      width: {
        type: ['number', 'string'],
        description: 'Width of the skeleton shape.',
        docs: {
          displayType: 'string',
        },
      },
    },
  },
};
