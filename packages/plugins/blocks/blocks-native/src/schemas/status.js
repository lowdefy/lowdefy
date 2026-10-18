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

const STATUS_NAMES = [
  'backlog',
  'todo',
  'inProgress',
  'inReview',
  'needsInput',
  'unmerged',
  'readyForRelease',
  'done',
  'cancelled',
  'priorityUrgent',
  'priorityHigh',
  'priorityMedium',
  'priorityLow',
  'priorityNone',
  'dot',
];

const name = {
  type: 'string',
  enum: STATUS_NAMES,
  description:
    'The glyph: a status (backlog dashed circle, todo empty circle, inProgress half filled, inReview three quarters, needsInput orange with a dot, unmerged purple with a dot, readyForRelease purple filled, done filled check, cancelled grey cross), a priority (priorityUrgent, priorityHigh, priorityMedium, priorityLow, priorityNone bars) or a coloured stage dot.',
};

// A status glyph: its name, or the name with colour, size and label.
export default {
  oneOf: [
    name,
    {
      type: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        name,
        color: {
          type: 'string',
          description:
            "The glyph colour in place of the status's own: a palette hue (blue, purple, teal, amber, grey, ...), a theme token name or a colour. A stage dot is grey unless set.",
          docs: { displayType: 'color' },
        },
        size: {
          type: 'number',
          default: 16,
          description: 'The glyph size in points.',
        },
        label: {
          type: ['string', 'boolean'],
          description:
            "Text beside the glyph, such as a stage name. true shows the status's own name (In progress).",
        },
        title: {
          type: 'string',
          description: "What a screen reader says. Defaults to the label or the status's name.",
        },
      },
    },
  ],
};
