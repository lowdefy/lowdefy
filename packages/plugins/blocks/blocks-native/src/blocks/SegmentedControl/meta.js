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

import { disabled, theme } from '../../schemas/inputProperties.js';

const primitiveOption = {
  type: ['string', 'number', 'boolean'],
};

export default {
  category: 'input',
  icons: [],
  valueType: 'any',
  cssKeys: {
    element: 'The SegmentedControl.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when a segment is picked.',
      event: { value: 'The value of the picked option.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      disabled,
      options: {
        description:
          'The segments, in order: primitives, or objects with a label and a value. Keep labels short; two to four segments fit a phone.',
        oneOf: [
          { type: 'array', items: primitiveOption },
          {
            type: 'array',
            items: {
              type: 'object',
              required: ['value'],
              additionalProperties: false,
              properties: {
                label: { type: 'string', description: 'Segment label, shown as plain text.' },
                value: { description: 'The value the segment sets. Can be any type.' },
              },
            },
          },
        ],
      },
      theme,
      title: {
        type: 'string',
        description: 'The label screen readers read for the control. Not drawn.',
      },
    },
  },
};
