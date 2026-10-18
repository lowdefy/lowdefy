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

// A mobile-only block: iOS page control dots.
export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The row of dots.',
  },
  events: {},
  properties: {
    type: 'object',
    additionalProperties: false,
    required: ['count'],
    properties: {
      count: {
        type: 'integer',
        minimum: 0,
        description: 'The number of pages, one dot each. No dots are drawn for 0.',
      },
      index: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description:
          'The page shown, from 0. Its dot is drawn in full colour, and slides to its place when the index changes.',
      },
      color: {
        type: 'string',
        description:
          'The colour of the dots: a palette hue (`blue`), a theme token (`colorPrimary`) or a hex colour. The active dot takes it in full, the others at 30%. Defaults to the label colour.',
      },
    },
  },
};
