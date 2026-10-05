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

import { validate } from '@lowdefy/ajv';
import { STEP_KEYS } from '@lowdefy/node-utils';

import journeySchema from './journeySchema.js';
import validateJourney from './validateJourney.js';

const minimalJourney = {
  name: 'submits the form',
  pageId: 'form',
  steps: [{ click: 'submit' }],
};

test('journeySchema takes its step key enum from the shared journey grammar', () => {
  expect(journeySchema.properties.steps.items.propertyNames.enum).toEqual(STEP_KEYS);
});

test('journeySchema accepts a minimal valid journey', () => {
  expect(validate({ schema: journeySchema, data: minimalJourney })).toEqual({ valid: true });
  expect(validateJourney({ journey: minimalJourney })).toEqual({ valid: true });
});

test('journeySchema accepts every step key, an inline user and urlQuery', () => {
  const journey = {
    name: 'full grammar',
    pageId: 'controls',
    user: { roles: ['admin'] },
    urlQuery: { status: 'open' },
    steps: [
      { click: 'new_control' },
      { fill: { blockId: 'title', value: 'Access reviews' } },
      { select: { blockId: 'owner', value: 'Alice' } },
      { press: 'Mod+k' },
      { goto: 'controls' },
      { email: { to: 'alice@example.test', subject: 'Invited' } },
      { as: 'reviewer' },
      { wait: { request: 'get_controls' } },
      { screenshot: 'after-submit' },
      { expect: { state: { path: 'controls.0.title', equals: 'Access reviews' } } },
    ],
  };
  expect(validateJourney({ journey })).toEqual({ valid: true });
  expect(
    validateJourney({ journey: { ...journey, user: { sub: 'u1', roles: ['admin'] } } })
  ).toEqual({ valid: true });
});

test('journeySchema accepts user none for a journey that signs in through the app', () => {
  expect(validateJourney({ journey: { ...minimalJourney, user: 'none' } })).toEqual({
    valid: true,
  });
});

test.each([1, 5000, 60000])('journeySchema accepts a timeout of %j ms', (timeout) => {
  expect(validateJourney({ journey: { ...minimalJourney, timeout } })).toEqual({ valid: true });
});

test.each([0, 60001, 2.5, '5000'])('journeySchema rejects a timeout of %j', (timeout) => {
  const result = validateJourney({ journey: { ...minimalJourney, timeout } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(
    'Journey "timeout" should be a whole number of milliseconds from 1 to 60000 - how long each step may wait.'
  );
});

test.each([true, 3, [[3]]])('journeySchema rejects user %j', (user) => {
  const result = validateJourney({ journey: { ...minimalJourney, user } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(
    'Journey "user" should be an inline user object, e.g. {roles: [admin]}, "none" to sign in through the app, the name of a user in the journey\'s data set, or a list of such names, e.g. [admin, member].'
  );
});

test('journeySchema accepts a list of data set user names on a journey with data', () => {
  expect(
    validateJourney({ journey: { ...minimalJourney, data: 'crm', user: ['admin', 'member'] } })
  ).toEqual({ valid: true });
});

test.each([
  [['admin'], undefined, 'declares no "data"'],
  [[], 'crm', 'empty list'],
  [['admin', 'none'], 'crm', 'Received "none".'],
  [['admin', 'admin'], 'crm', 'names "admin" more than once'],
])('journeySchema refuses user list %j with data %j', (user, data, message) => {
  const result = validateJourney({ journey: { ...minimalJourney, data, user } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(message);
});

test('journeySchema rejects a step with two keys', () => {
  const journey = { ...minimalJourney, steps: [{ click: 'a', fill: { blockId: 'b', value: 1 } }] };
  const result = validateJourney({ journey });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Journey step should have exactly one key.');
});

test('journeySchema rejects an unknown step key', () => {
  const journey = { ...minimalJourney, steps: [{ tap: 'a' }] };
  const result = validateJourney({ journey });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(
    'Unknown journey step key. Steps are: click, open, fill, select, press, back, goto, email, as, wait, screenshot, expect.'
  );
});

test('journeySchema accepts a journey with an open step the runner accepts', () => {
  const journey = { ...minimalJourney, steps: [{ open: 'status' }, { click: { text: 'Done' } }] };
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('validateJourney accepts expect.hidden, expect.calls and click.count', () => {
  const journey = {
    ...minimalJourney,
    steps: [
      { click: { blockId: 'submit', count: 2 } },
      { expect: { hidden: 'error_alert' } },
      { expect: { calls: { request: 'save', pageId: 'form', count: 1 } } },
      { expect: { calls: { endpoint: 'notify', count: 0 } } },
    ],
  };
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('journeySchema accepts a variant key and rejects unknown keys inside it', () => {
  const variant = {
    of: 'submits the form',
    kind: 'double-submit',
    detail: 'double click "submit"',
  };
  expect(validateJourney({ journey: { ...minimalJourney, variant } })).toEqual({ valid: true });
  const extra = validateJourney({
    journey: { ...minimalJourney, variant: { ...variant, seed: 1 } },
  });
  expect(extra.valid).toBe(false);
  expect(extra.message).toContain('Journey "variant" should only have "of", "kind" and "detail".');
  const missing = validateJourney({ journey: { ...minimalJourney, variant: { of: 'x' } } });
  expect(missing.message).toContain('Journey "variant" should have "of", "kind" and "detail".');
  const wrongType = validateJourney({
    journey: { ...minimalJourney, variant: { ...variant, kind: 3 } },
  });
  expect(wrongType.message).toContain('Journey "variant.kind" should be a string.');
});

test('validateJourney accepts tags and refuses a tag outside the grammar pattern', () => {
  expect(validateJourney({ journey: { ...minimalJourney, tags: ['smoke', 'review'] } })).toEqual({
    valid: true,
  });
  expect(validateJourney({ journey: { ...minimalJourney, tags: ['Smoke'] } })).toEqual({
    valid: false,
    message:
      'Journey "tags": Tag "Smoke" should be lowercase letters, digits, "-" and "_", start with a letter or digit, and be at most 64 characters.',
  });
});

test('journeySchema refuses tags that are not a list of distinct strings', () => {
  const message = 'Journey "tags" should be a list of distinct tag strings, e.g. [smoke, review].';
  expect(validateJourney({ journey: { ...minimalJourney, tags: 'smoke' } }).message).toContain(
    message
  );
  expect(validateJourney({ journey: { ...minimalJourney, tags: [1] } }).message).toContain(message);
  expect(
    validateJourney({ journey: { ...minimalJourney, tags: ['smoke', 'smoke'] } }).message
  ).toContain(message);
});

test('validateJourney reports a malformed step with the grammar error naming the step', () => {
  const journey = { ...minimalJourney, steps: [{ click: 'a' }, { fill: { blockId: 'title' } }] };
  expect(validateJourney({ journey })).toEqual({
    valid: false,
    message: 'Step 1: Step "fill" requires a "value". Received {"blockId":"title"}.',
  });
});

test('journeySchema rejects a journey without steps', () => {
  const result = validateJourney({ journey: { name: 'x', pageId: 'p' } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Journey should have required property "steps".');
});

test('journeySchema rejects an empty steps array', () => {
  const result = validateJourney({ journey: { ...minimalJourney, steps: [] } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Journey "steps" should have at least one step.');
});

test('journeySchema rejects a missing name and a non-string pageId', () => {
  expect(validateJourney({ journey: { pageId: 'p', steps: [{ click: 'a' }] } }).message).toContain(
    'Journey should have required property "name".'
  );
  expect(
    validateJourney({ journey: { name: 'n', pageId: 2, steps: [{ click: 'a' }] } }).message
  ).toContain('Journey "pageId" should be a string.');
});

test('journeySchema rejects a non-object journey', () => {
  const result = validateJourney({ journey: 'not a journey' });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Journey should be an object.');
});

const fullEvidence = {
  production: {
    sessions: 412,
    persons: 37,
    orgs: 9,
    share: 0.31,
    failures: 14,
    window: '2026-09-03/2026-10-02',
  },
  dev: { recordings: 2 },
  explorer: { prs: [2531] },
  mutation: { killed: 11, total: 12, unique: 2 },
  refreshed: '2026-10-03',
};

test('journeySchema accepts a full evidence key', () => {
  expect(validateJourney({ journey: { ...minimalJourney, evidence: fullEvidence } })).toEqual({
    valid: true,
  });
});

test('journeySchema accepts evidence.mutation without unique', () => {
  const evidence = { ...fullEvidence, mutation: { killed: 3, total: 3 } };
  expect(validateJourney({ journey: { ...minimalJourney, evidence } })).toEqual({ valid: true });
});

test.each([
  ['evidence', { ...fullEvidence, extra: 1 }, 'Journey "evidence" has an unknown key'],
  [
    'evidence.production',
    { ...fullEvidence, production: { ...fullEvidence.production, users: 3 } },
    'Journey "evidence.production" has an unknown key',
  ],
  [
    'evidence.dev',
    { ...fullEvidence, dev: { recordings: 2, runs: 1 } },
    'Journey "evidence.dev" has an unknown key',
  ],
  [
    'evidence.explorer',
    { ...fullEvidence, explorer: { prs: [1], walks: 2 } },
    'Journey "evidence.explorer" has an unknown key',
  ],
  [
    'evidence.mutation',
    { ...fullEvidence, mutation: { killed: 1, total: 2, survived: 1 } },
    'Journey "evidence.mutation" has an unknown key',
  ],
])('journeySchema refuses an unknown key in %s', (_, evidence, message) => {
  const result = validateJourney({ journey: { ...minimalJourney, evidence } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(message);
});

test('journeySchema refuses evidence.production without a window', () => {
  const { window, ...production } = fullEvidence.production;
  const result = validateJourney({
    journey: { ...minimalJourney, evidence: { ...fullEvidence, production } },
  });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('Journey "evidence.production" should have');
});

test('journeySchema refuses an evidence share above 1', () => {
  const evidence = { ...fullEvidence, production: { ...fullEvidence.production, share: 1.2 } };
  const result = validateJourney({ journey: { ...minimalJourney, evidence } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain(
    'Journey "evidence.production.share" should be a number from 0 to 1.'
  );
});

test.each(['2026-09-03', '2026-09-03..2026-10-02'])(
  'journeySchema refuses the evidence window %j',
  (window) => {
    const evidence = { ...fullEvidence, production: { ...fullEvidence.production, window } };
    const result = validateJourney({ journey: { ...minimalJourney, evidence } });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('evidence.production.window');
  }
);

test('validateJourney refuses more mutants killed than total, naming both numbers', () => {
  const evidence = { ...fullEvidence, mutation: { killed: 13, total: 12 } };
  const result = validateJourney({ journey: { ...minimalJourney, evidence } });
  expect(result).toEqual({
    valid: false,
    message:
      'Journey "evidence.mutation.killed" (13) should not be more than "evidence.mutation.total" (12).',
  });
});

test('journeySchema accepts data and a data set user name', () => {
  expect(
    validateJourney({ journey: { ...minimalJourney, data: 'staging-sample', user: 'member' } })
  ).toEqual({ valid: true });
});

test.each(['../x', 'Staging', '-x', ''])('journeySchema refuses data %j', (data) => {
  const result = validateJourney({ journey: { ...minimalJourney, data } });
  expect(result.valid).toBe(false);
  expect(result.message).toMatch('Journey "data" should be a data set name');
});
