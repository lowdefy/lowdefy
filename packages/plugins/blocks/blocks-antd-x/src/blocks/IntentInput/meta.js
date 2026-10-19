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

const level = { type: 'number', minimum: 0, maximum: 1 };
const mode = '`idle` (nothing recognised), `preview`, `choose` or `committed`.';

export default {
  // An input with slots: its value is { text, intent, mode }, and each intent shows the
  // slot named after it, so slot names are authored and cannot be enumerated.
  category: 'input-container',
  icons: [],
  valueType: 'object',
  slots: false,
  cssKeys: {
    element: 'The IntentInput element.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when the user types.',
      event: { text: 'The current text.' },
    },
    onClassify: {
      description:
        'Trigger actions shortly after the text changes, to classify it. Typically runs a Decide request whose answer is passed back as `answer`.',
      event: { text: 'The text to classify.' },
    },
    onIntentChange: {
      description: 'Trigger actions when the shown intent or its mode changes.',
      event: { intent: 'The shown intent, or null.', mode },
    },
    onSubmit: {
      description: 'Trigger actions when Enter is pressed.',
      event: { text: 'The current text.', intent: 'The shown intent, or null.', mode },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus: { type: 'boolean', description: 'Focus the input on mount.' },
      placeholder: { type: 'string', description: 'Placeholder text.' },
      intents: {
        type: 'object',
        description:
          'The intents the text can become, by name. Each name is also the slot shown for it. The same object can be the options of the Decide question that classifies the text.',
        docs: { displayType: 'yaml' },
        additionalProperties: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string', description: 'Name shown on the badge and choices.' },
            icon: {
              type: ['string', 'object'],
              description: 'Icon name or Icon block properties for the badge and choices.',
            },
            color: { type: 'string', description: 'Accent color of the edge and badge.' },
            description: {
              type: 'string',
              description: 'What the intent means. Read by the classifier, not shown.',
            },
          },
        },
      },
      answer: {
        type: ['object', 'null'],
        description:
          'The classification of the current text, in the shape of a Decide choice answer: `_request: classify.intent`. Options that are not intents, such as a `none` option, are ignored. While a new answer loads, the last one is kept.',
        docs: { displayType: 'yaml' },
        properties: {
          choice: { type: ['string', 'null'] },
          confidence: { type: ['number', 'null'] },
          probabilities: { type: ['object', 'null'], additionalProperties: { type: 'number' } },
        },
      },
      confidence: {
        type: 'object',
        additionalProperties: false,
        description: 'How sure the answer must be before the slot changes how it looks.',
        docs: { displayType: 'yaml' },
        properties: {
          preview: {
            ...level,
            default: 0.3,
            description: 'Show a faded preview of the slot from this confidence.',
          },
          show: {
            ...level,
            default: 0.6,
            description: 'Commit to the intent and show its slot solid from this confidence.',
          },
          switch: {
            ...level,
            default: 0.85,
            description:
              'Replace the shown intent at once from this confidence. Below it, another intent must lead twice in a row, or hold the lead while the user pauses.',
          },
        },
      },
    },
  },
};
