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

// Kept in one place: the schema below and the runner's error messages both use it.
// Must match the step grammar of POST /lowdefy-docs/journey in @lowdefy/server-dev.
export const JOURNEY_STEP_KEYS = [
  'click',
  'fill',
  'select',
  'press',
  'back',
  'goto',
  'email',
  'as',
  'wait',
  'screenshot',
  'expect',
];

const journeySchema = {
  type: 'object',
  required: ['name', 'pageId', 'steps'],
  properties: {
    name: {
      type: 'string',
      errorMessage: { type: 'Journey "name" should be a string.' },
    },
    pageId: {
      type: 'string',
      errorMessage: { type: 'Journey "pageId" should be a string.' },
    },
    // Must match the data set name pattern in @lowdefy/node-utils.
    data: {
      type: 'string',
      pattern: '^[a-z0-9][a-z0-9_-]{0,63}$',
      description:
        "The data set (tests/data/<name>.yaml) the journey runs on, in a fresh database of its own. Every value the journey types, selects, clicks by text or asserts comes from the data set's fixtures or users, or is UI text, never from its snapshot. See https://docs.lowdefy.com/journey-data-sets.",
      errorMessage:
        'Journey "data" should be a data set name (tests/data/<name>.yaml): lowercase letters, digits, "-" and "_".',
    },
    user: {
      anyOf: [{ type: 'object' }, { const: 'none' }, { type: 'string' }],
      errorMessage:
        'Journey "user" should be an inline user object, e.g. {roles: [admin]}, "none" to sign in through the app, or the name of a user in the journey\'s data set.',
    },
    urlQuery: {
      type: 'object',
      errorMessage: { type: 'Journey "urlQuery" should be an object.' },
    },
    // Must match MAX_JOURNEY_TIMEOUT in @lowdefy/server-dev.
    timeout: {
      type: 'integer',
      minimum: 1,
      maximum: 60000,
      errorMessage:
        'Journey "timeout" should be a whole number of milliseconds from 1 to 60000 - how long each step may wait.',
    },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        minProperties: 1,
        maxProperties: 1,
        propertyNames: { enum: JOURNEY_STEP_KEYS },
        errorMessage: {
          type: 'Journey step should be an object with exactly one key.',
          minProperties: 'Journey step should have exactly one key.',
          maxProperties: 'Journey step should have exactly one key.',
          propertyNames: `Unknown journey step key. Steps are: ${JOURNEY_STEP_KEYS.join(', ')}.`,
        },
      },
      errorMessage: {
        type: 'Journey "steps" should be an array of steps.',
        minItems: 'Journey "steps" should have at least one step.',
      },
    },
  },
  errorMessage: {
    type: 'Journey should be an object.',
    required: {
      name: 'Journey should have required property "name".',
      pageId: 'Journey should have required property "pageId".',
      steps: 'Journey should have required property "steps".',
    },
  },
};

export default journeySchema;
