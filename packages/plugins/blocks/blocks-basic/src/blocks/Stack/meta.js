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

import { ALIGN, GAP } from '../../arrangement.js';

export default {
  category: 'container',
  icons: [],
  valueType: null,
  hazards: [],
  slots: {
    content: 'Child blocks stacked in the column.',
  },
  cssKeys: {
    element: 'The Stack flex container element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      gap: {
        type: 'string',
        enum: Object.keys(GAP),
        default: 'md',
        description: 'Space between the children.',
      },
      align: {
        type: 'string',
        enum: Object.keys(ALIGN),
        default: 'stretch',
        description: 'Alignment of the children on the cross (horizontal) axis.',
      },
    },
  },
};
