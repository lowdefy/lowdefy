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

import Ajv from 'ajv';
import { type } from '@lowdefy/helpers';

import JOURNEY_STEP_EXAMPLES from './journeyStepExamples.js';
import journeyStepSchema, { JOURNEY_STEP_SCHEMAS } from './journeyStepSchema.js';
import validateJourneySteps, { STEP_KEYS } from './validateJourneySteps.js';

// The schema is what an agent reads; validateJourneySteps is what runs. These
// tests hold the two to the same steps.
const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(journeyStepSchema);

// After a click, so expect.error and expect.effect are placed where they may be.
function validatorAccepts(step) {
  return type.isUndefined(validateJourneySteps({ steps: [{ click: 'save' }, step] }).error);
}

const VALID_STEPS = [
  { click: 'submit' },
  { click: { blockId: 'grid', row: 1, text: 'Edit' } },
  { click: { blockId: 'grid', row: 0, column: 'actions', nth: 1 } },
  { click: { blockId: 'members_list', containing: 'ada@example.test' } },
  { click: { text: 'OK' } },
  { click: { blockId: 'submit', count: 2 } },
  { open: 'status' },
  { open: { blockId: 'status', nth: 0 } },
  { fill: { blockId: 'name', value: 'Ada' } },
  { fill: { blockId: 'age', value: 0 } },
  { fill: { blockId: 'title', value: null, from: 'shape' } },
  { fill: { blockId: 'title', value: 'Ada', from: 'recorded' } },
  { fill: { blockId: 'grid', row: 2, column: 'name', value: 'Ada' } },
  { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test', match: '\\b\\d{6}\\b' } } },
  {
    fill: {
      blockId: 'otp',
      fromEmail: { to: 'ada@example.test', subject: 'Sign in', match: 'code (\\d+)' },
    },
  },
  { select: { blockId: 'country', value: 'Chile' } },
  { select: { blockId: 'owner', value: null, from: 'shape' } },
  { press: 'Mod+k' },
  { back: true },
  { back: null },
  { goto: 'dashboard' },
  { goto: { pageId: 'invoice', urlQuery: { id: 'inv-1' } } },
  { goto: { pageId: 'ticket', pathParams: { space: 's', ticket_id: '1' } } },
  { email: { to: 'ada@example.test' } },
  { email: { to: 'ada@example.test', subject: 'Verify' } },
  { as: 'invitee' },
  { wait: 3000 },
  { wait: { ms: 100 } },
  { wait: { request: 'get_rows' } },
  { wait: { state: 'rows' } },
  { screenshot: 'after' },
  { screenshot: true },
  { screenshot: null },
  { expect: { state: { path: 'saved', equals: true } } },
  { expect: { state: { path: 'title', equals: null, from: 'shape' } } },
  { expect: { visible: 'modal' } },
  { expect: { visible: { blockId: 'members_list', containing: 'Owner' } } },
  { expect: { hidden: 'error_alert' } },
  { expect: { text: { blockId: 'title', contains: 'Hello' } } },
  { expect: { text: { blockId: 'grid', row: 0, column: 'title', contains: 'Access' } } },
  { expect: { url: { contains: '/detail' } } },
  { expect: { title: { equals: 'Tasks' } } },
  { expect: { title: { contains: 'Task' } } },
  { expect: { calls: { request: 'save', pageId: 'tickets', count: 1 } } },
  { expect: { calls: { endpoint: 'notify', count: 0 } } },
  ...Object.values(JOURNEY_STEP_EXAMPLES).flat(),
];

const INVALID_STEPS = [
  'click submit',
  {},
  { hover: 'a' },
  { click: 'a', fill: { blockId: 'b', value: 'x' } },
  { click: 7 },
  { click: {} },
  { click: { blockId: 7 } },
  { click: { blockId: 'grid', row: -1 } },
  { click: { blockId: 'grid', row: '0' } },
  { click: { text: 'Edit', row: 0 } },
  { click: { text: 'Edit', column: 'actions' } },
  { click: { text: 'Edit', nth: 1.5 } },
  { click: { blockId: 'grid', colum: 'actions' } },
  { click: { blockId: 'list', containing: '' } },
  { click: { blockId: 'list', text: 'Edit', containing: 'ada' } },
  { click: { blockId: 'a', count: 4 } },
  { click: { blockId: 'a', from: 'recorded' } },
  { open: 5 },
  { open: { blockId: 'a', count: 2 } },
  { fill: 'name' },
  { fill: { value: 'x' } },
  { fill: { text: 'Name', value: 'x' } },
  { fill: { blockId: 'name' } },
  { fill: { blockId: 'a', value: null } },
  { fill: { blockId: 'a', value: 'x', from: 'guess' } },
  { fill: { blockId: 'otp', value: '1', fromEmail: { to: 'ada@example.test', match: '\\d' } } },
  { fill: { blockId: 'otp', fromEmail: 'ada@example.test' } },
  { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test' } } },
  { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test', pattern: '\\d' } } },
  { select: { value: 'x' } },
  { select: { blockId: 'a', value: null, from: 'recorded' } },
  { press: ['Enter'] },
  { back: 'home' },
  { back: false },
  { goto: '' },
  { goto: 7 },
  { goto: { urlQuery: { id: '1' } } },
  { goto: { pageId: 'invoice', urlQuery: 'id=1' } },
  { goto: { pageId: 'ticket', pathParams: { ticket_id: 1 } } },
  { goto: { pageId: 'invoice', url: '/invoice' } },
  { email: 'ada@example.test' },
  { email: { to: '' } },
  { email: { to: 'ada@example.test', subjet: 'Verify' } },
  { as: '' },
  { as: { name: 'invitee' } },
  { wait: '100' },
  { wait: { ms: 1, request: 'r' } },
  { wait: { until: 'x' } },
  { wait: { ms: '100' } },
  { wait: { request: 1 } },
  { screenshot: 3 },
  { expect: 'visible' },
  { expect: { count: 1 } },
  { expect: { state: { path: 'a' } } },
  { expect: { state: { path: 'a', equals: 1, form: 'shape' } } },
  { expect: { visible: 7 } },
  { expect: { visible: { row: 0 } } },
  { expect: { hidden: { colum: 'a' } } },
  { expect: { text: { blockId: 'a' } } },
  { expect: { text: { text: 'OK', contains: 'OK' } } },
  { expect: { url: '/detail' } },
  { expect: { title: 'Tasks' } },
  { expect: { title: { equals: 'Tasks', contains: 'T' } } },
  { expect: { calls: { request: 'save', endpoint: 'notify', count: 1 } } },
  { expect: { calls: { endpoint: 'notify', pageId: 'tickets', count: 1 } } },
  { expect: { calls: { request: 'save', count: -1 } } },
  { expect: { calls: { request: '', count: 1 } } },
  { expect: { error: '' } },
  { expect: { effect: false } },
];

test.each(VALID_STEPS.map((step) => [step]))(
  'journeyStepSchema and validateJourneySteps both accept %j',
  (step) => {
    expect(validatorAccepts(step)).toBe(true);
    expect(validateSchema(step)).toBe(true);
  }
);

test.each(INVALID_STEPS.map((step) => [step]))(
  'journeyStepSchema and validateJourneySteps both refuse %j',
  (step) => {
    expect(validatorAccepts(step)).toBe(false);
    expect(validateSchema(step)).toBe(false);
  }
);

test('journeyStepSchema has one schema per step, each with examples', () => {
  expect(Object.keys(JOURNEY_STEP_SCHEMAS)).toEqual(STEP_KEYS);
  STEP_KEYS.forEach((key) => {
    expect(JOURNEY_STEP_SCHEMAS[key].properties[key].examples).toEqual(JOURNEY_STEP_EXAMPLES[key]);
  });
});

test('every expect kind the validator knows has examples', () => {
  const expectKinds = journeyStepSchema.oneOf
    .find((schema) => schema.required[0] === 'expect')
    .properties.expect.oneOf.map((schema) => schema.required[0]);
  expectKinds.forEach((kind) => {
    expect(JOURNEY_STEP_EXAMPLES[`expect.${kind}`]).toBeDefined();
  });
});
