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

import { STEP_KEYS } from '@lowdefy/node-utils';

const DAY = '^\\d{4}-\\d{2}-\\d{2}$';
const WINDOW = '^\\d{4}-\\d{2}-\\d{2}/\\d{4}-\\d{2}-\\d{2}$';

function count({ key }) {
  return {
    type: 'integer',
    minimum: 0,
    errorMessage: `Journey "${key}" should be a whole number of 0 or more.`,
  };
}

// How much real use backs a journey. Only `lowdefy journeys evidence --refresh`
// writes it, so every level is strict: a hand-edited typo fails here, before
// the browser opens. killed <= total is checked in validateJourney.
const evidenceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    production: {
      type: 'object',
      additionalProperties: false,
      required: ['sessions', 'persons', 'orgs', 'share', 'failures', 'window'],
      properties: {
        sessions: count({ key: 'evidence.production.sessions' }),
        persons: count({ key: 'evidence.production.persons' }),
        orgs: count({ key: 'evidence.production.orgs' }),
        failures: count({ key: 'evidence.production.failures' }),
        share: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          errorMessage: 'Journey "evidence.production.share" should be a number from 0 to 1.',
        },
        window: {
          type: 'string',
          pattern: WINDOW,
          errorMessage:
            'Journey "evidence.production.window" should be two dates as YYYY-MM-DD/YYYY-MM-DD.',
        },
      },
      errorMessage: {
        type: 'Journey "evidence.production" should be an object.',
        additionalProperties:
          'Journey "evidence.production" has an unknown key. Keys are: sessions, persons, orgs, share, failures, window.',
        required:
          'Journey "evidence.production" should have sessions, persons, orgs, share, failures and window.',
      },
    },
    dev: {
      type: 'object',
      additionalProperties: false,
      required: ['recordings'],
      properties: { recordings: count({ key: 'evidence.dev.recordings' }) },
      errorMessage: {
        type: 'Journey "evidence.dev" should be an object.',
        additionalProperties: 'Journey "evidence.dev" has an unknown key. Keys are: recordings.',
        required: 'Journey "evidence.dev" should have recordings.',
      },
    },
    explorer: {
      type: 'object',
      additionalProperties: false,
      required: ['prs'],
      properties: {
        prs: {
          type: 'array',
          items: { type: 'integer', minimum: 1 },
          errorMessage: 'Journey "evidence.explorer.prs" should be a list of pull request numbers.',
        },
      },
      errorMessage: {
        type: 'Journey "evidence.explorer" should be an object.',
        additionalProperties: 'Journey "evidence.explorer" has an unknown key. Keys are: prs.',
        required: 'Journey "evidence.explorer" should have prs.',
      },
    },
    mutation: {
      type: 'object',
      additionalProperties: false,
      required: ['killed', 'total'],
      properties: {
        killed: count({ key: 'evidence.mutation.killed' }),
        total: count({ key: 'evidence.mutation.total' }),
        unique: count({ key: 'evidence.mutation.unique' }),
      },
      errorMessage: {
        type: 'Journey "evidence.mutation" should be an object.',
        additionalProperties:
          'Journey "evidence.mutation" has an unknown key. Keys are: killed, total, unique.',
        required: 'Journey "evidence.mutation" should have killed and total.',
      },
    },
    refreshed: {
      type: 'string',
      pattern: DAY,
      errorMessage: 'Journey "evidence.refreshed" should be a date as YYYY-MM-DD.',
    },
  },
  errorMessage: {
    type: 'Journey "evidence" should be an object.',
    additionalProperties:
      'Journey "evidence" has an unknown key. Keys are: production, dev, explorer, mutation, refreshed.',
  },
};

// The step grammar itself lives in @lowdefy/node-utils, shared with the dev
// server's journey runner; this schema checks the file's shape and the step
// names, and validateJourney runs the grammar over the steps.
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
      anyOf: [{ type: 'object' }, { const: 'none' }],
      errorMessage:
        'Journey "user" should be an inline user object, e.g. {roles: [admin]}, or "none" to sign in through the app.',
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
    evidence: evidenceSchema,
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        minProperties: 1,
        maxProperties: 1,
        propertyNames: { enum: STEP_KEYS },
        errorMessage: {
          type: 'Journey step should be an object with exactly one key.',
          minProperties: 'Journey step should have exactly one key.',
          maxProperties: 'Journey step should have exactly one key.',
          propertyNames: `Unknown journey step key. Steps are: ${STEP_KEYS.join(', ')}.`,
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
