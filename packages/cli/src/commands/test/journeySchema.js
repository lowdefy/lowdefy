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
    user: {
      type: 'object',
      errorMessage: {
        type: 'Journey "user" should be an inline user object, e.g. {roles: [admin]}.',
      },
    },
    urlQuery: {
      type: 'object',
      errorMessage: { type: 'Journey "urlQuery" should be an object.' },
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
