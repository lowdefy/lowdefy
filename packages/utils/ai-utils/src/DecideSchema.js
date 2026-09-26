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

import { RESERVED_QUESTION_IDS } from './decideQuestions.js';

const text = { type: 'string', minLength: 1 };

const choiceQuestion = {
  type: 'object',
  required: ['choice', 'options'],
  additionalProperties: false,
  properties: {
    choice: { ...text, description: 'What to decide — picks exactly one of "options".' },
    options: {
      type: 'object',
      minProperties: 2,
      maxProperties: 255,
      additionalProperties: { type: ['string', 'null'] },
      description: 'Option names mapped to what each one means (null for no description).',
    },
  },
};

const yesnoQuestion = {
  type: 'object',
  required: ['yesno'],
  additionalProperties: false,
  properties: {
    yesno: { ...text, description: 'A statement to judge true or false.' },
    criteria: {
      type: 'object',
      additionalProperties: false,
      properties: { yes: { type: 'string' }, no: { type: 'string' } },
      description: 'Optional: what counts as yes and as no.',
    },
  },
};

const scoreQuestion = {
  type: 'object',
  required: ['score', 'levels'],
  additionalProperties: false,
  properties: {
    score: { ...text, description: 'What to rate — places the state on "levels".' },
    levels: {
      type: 'array',
      minItems: 2,
      maxItems: 10,
      items: { type: 'string' },
      description: 'Ordered levels, lowest first.',
    },
  },
};

const BACKEND_DESCRIPTIONS = {
  evaluation:
    'evaluation — an evaluation model (e.g. "typesafe-ai/jev" on the AI Gateway): typed answers with calibrated probabilities, input tokens only.',
  'structured-output':
    "structured-output — any language model, asked for the answers as structured output; its confidence is the model's own estimate.",
};

// One schema per connection type: the backends it offers set the enum, and
// the first is the default.
function decideSchema({ backends }) {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Lowdefy Request Schema - Decide',
    type: 'object',
    required: ['model', 'state', 'questions'],
    properties: {
      model: {
        type: 'string',
        description: 'Model id to decide with.',
        errorMessage: { type: 'Decide request property "model" should be a string.' },
      },
      backend: {
        type: 'string',
        enum: backends,
        description: `How the model is asked (default "${backends[0]}"): ${backends
          .map((backend) => BACKEND_DESCRIPTIONS[backend])
          .join(' ')}`,
        errorMessage: {
          type: 'Decide request property "backend" should be a string.',
          enum: `Decide request property "backend" should be one of: ${backends.join(', ')}.`,
        },
      },
      state: {
        type: ['string', 'object', 'array'],
        description:
          'What the questions are about — text, an object or an array. Send only what the questions need.',
        errorMessage: {
          type: 'Decide request property "state" should be a string, object or array.',
        },
      },
      questions: {
        type: 'object',
        minProperties: 1,
        propertyNames: { not: { enum: RESERVED_QUESTION_IDS } },
        additionalProperties: {
          oneOf: [choiceQuestion, yesnoQuestion, scoreQuestion],
          errorMessage:
            'Decide questions should be one of { choice, options }, { yesno, criteria? } or { score, levels }.',
        },
        description:
          'Named questions, answered together against the state. Each id becomes a key of the response.',
        errorMessage: {
          type: 'Decide request property "questions" should be an object.',
          minProperties: 'Decide request property "questions" should have at least one question.',
          propertyNames: `Decide question ids may not be ${RESERVED_QUESTION_IDS.map(
            (id) => `"${id}"`
          ).join(', ')} — the response uses them.`,
        },
      },
      maxRetries: {
        type: 'integer',
        minimum: 0,
        description: 'Maximum number of retries. Defaults to 2.',
        errorMessage: {
          type: 'Decide request property "maxRetries" should be an integer.',
          minimum: 'Decide request property "maxRetries" should be at least 0.',
        },
      },
      providerOptions: {
        type: 'object',
        description:
          'Provider-specific options, keyed by provider (e.g. { gateway: { zeroDataRetention: true } }).',
        errorMessage: { type: 'Decide request property "providerOptions" should be an object.' },
      },
    },
    errorMessage: {
      type: 'Decide request properties should be an object.',
      required: {
        model: 'Decide request should have required property "model".',
        state: 'Decide request should have required property "state".',
        questions: 'Decide request should have required property "questions".',
      },
    },
  };
}

export default decideSchema;
