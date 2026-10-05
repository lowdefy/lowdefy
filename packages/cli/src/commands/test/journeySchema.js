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
    pathParams: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description:
        "Values for the placeholders of the page's path, one string per placeholder, read by _path_params.",
      errorMessage:
        'Journey "pathParams" should be an object of strings, one per placeholder of the page\'s path.',
    },
    urlQuery: {
      type: 'object',
      errorMessage: { type: 'Journey "urlQuery" should be an object.' },
    },
    // The sections of the suite the journey belongs to, for `lowdefy test
    // --tag`. validateJourney checks each tag against the grammar's pattern.
    tags: {
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true,
      description:
        'Sections of the suite the journey belongs to, such as smoke or review. `lowdefy test --tag <tag>` runs the journeys carrying any of the given tags.',
      errorMessage:
        'Journey "tags" should be a list of distinct tag strings, e.g. [smoke, review].',
    },
    // Written by `lowdefy journeys variants` on the edge-case candidates it
    // generates: the journey it varies, the kind of edge case and its detail.
    variant: {
      type: 'object',
      required: ['of', 'kind', 'detail'],
      additionalProperties: false,
      properties: {
        of: { type: 'string', errorMessage: { type: 'Journey "variant.of" should be a string.' } },
        kind: {
          type: 'string',
          errorMessage: { type: 'Journey "variant.kind" should be a string.' },
        },
        detail: {
          type: 'string',
          errorMessage: { type: 'Journey "variant.detail" should be a string.' },
        },
      },
      errorMessage: {
        type: 'Journey "variant" should be an object { of, kind, detail }.',
        required: 'Journey "variant" should have "of", "kind" and "detail".',
        additionalProperties: 'Journey "variant" should only have "of", "kind" and "detail".',
      },
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
