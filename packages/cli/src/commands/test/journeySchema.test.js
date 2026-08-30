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

import journeySchema, { JOURNEY_STEP_KEYS } from './journeySchema.js';
import validateJourney from './validateJourney.js';

const minimalJourney = {
  name: 'submits the form',
  pageId: 'form',
  steps: [{ click: 'submit' }],
};

test('journeySchema exports the step key list shared with the runner', () => {
  expect(JOURNEY_STEP_KEYS).toEqual([
    'click',
    'fill',
    'select',
    'press',
    'wait',
    'screenshot',
    'expect',
  ]);
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
      { wait: { request: 'get_controls' } },
      { screenshot: 'after-submit' },
      { expect: { state: { path: 'controls.0.title', equals: 'Access reviews' } } },
    ],
  };
  expect(validateJourney({ journey })).toEqual({ valid: true });
  expect(validateJourney({ journey: { ...journey, user: { sub: 'u1', roles: ['admin'] } } })).toEqual(
    { valid: true }
  );
});

test('journeySchema rejects a user that is not an object', () => {
  const result = validateJourney({ journey: { ...minimalJourney, user: 'admin' } });
  expect(result.valid).toBe(false);
  expect(result.message).toContain('user');
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
    'Unknown journey step key. Steps are: click, fill, select, press, wait, screenshot, expect.'
  );
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
