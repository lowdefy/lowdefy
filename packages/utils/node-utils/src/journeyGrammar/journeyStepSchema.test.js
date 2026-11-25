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
import { expect, test } from 'vitest';

// The schema is what an agent reads; validateJourneySteps is what runs. These
// tests hold the two to the same steps.
const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(journeyStepSchema);

// After a click, so expect.error and expect.effect are placed where they may be,
// expect.status after the call it reads, and a release after a hold of its request.
function validatorAccepts(step) {
  let before = { click: 'save' };
  if (type.isObject(step?.expect) && Object.hasOwn(step.expect, 'status')) {
    before = { call: { endpoint: 'save' } };
  }
  if (type.isObject(step) && type.isString(step.release)) {
    before = { hold: { requestId: step.release } };
  } else if (type.isObject(step) && type.isObject(step.release)) {
    before = { hold: step.release };
  }
  return type.isUndefined(validateJourneySteps({ steps: [before, step] }).error);
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
  { expect: { calls: { request: 'save', payload: { status: 'Open' } } } },
  { expect: { calls: { endpoint: 'notify', response: null, count: 1 } } },
  { expect: { status: 403 } },
  { expect: { db: { collection: 'orders', match: {}, count: 0 } } },
  { expect: { db: { collection: 'orders', connectionId: 'db', match: {}, equals: [{}] } } },
  { expect: { sunk: {} } },
  { expect: { sunk: { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', count: 2 } } },
  { expect: { sunk: { requestId: 'fetch_rate', match: { url: '/rates' } } } },
  { call: { endpoint: 'orders-cancel' } },
  { call: { endpoint: 'orders-cancel', payload: { id: 1 }, as: 'none' } },
  { call: { endpoint: 'orders-cancel', as: { roles: ['admin'] } } },
  { request: { pageId: 'orders', requestId: 'get_order' } },
  { request: { pageId: 'orders', requestId: 'get_order', payload: {}, as: 'client_b' } },
  { hold: { requestId: 'claim_run' } },
  { hold: { requestId: 'claim_run', endpoint: 'run-approve', pageId: 'runs' } },
  { release: 'claim_run' },
  { call: { endpoint: 'nightly_close', as: 'system' } },
  { call: { endpoint: 'nightly_close', as: { system: { organization: 'org_a' } } } },
  {
    call: {
      endpoint: 'nightly_close',
      as: { system: { organization: 'org_a', caller: { id: 'job', name: 'Nightly job' } } },
    },
  },
  { webhook: { endpoint: 'payment_events', body: { id: 'evt_1' } } },
  { webhook: { endpoint: 'payment_events', body: 'raw text', query: { a: '1' } } },
  { webhook: { endpoint: 'payment_events', body: null, headers: { 'x-signature': 'abc' } } },
  { click: { blockId: 'invoices', rowKey: 'inv-0042' } },
  { click: { blockId: 'invoices', rowKey: 'inv-0042', column: 'number' } },
  { click: { blockId: 'invoices', rowKey: 'inv-0042', control: 'void' } },
  { click: { blockId: 'invoices', rowKey: 'inv-0042', column: 'actions', control: 'void' } },
  { click: { blockId: 'delete_modal', control: 'ok' } },
  { expect: { visible: { blockId: 'invoices', rowKey: 'inv-0042' } } },
  { expect: { visible: { blockId: 'invoices', rowKey: 'inv-0042', column: 'number' } } },
  { expect: { hidden: { blockId: 'invoices', rowKey: 'inv-0042' } } },
  { expect: { visible: { blockId: 'issue_cards', control: 'onOpen', rowKey: 'issue-17' } } },
  { expect: { hidden: { blockId: 'delete_modal', control: 'ok' } } },
  { expect: { text: { blockId: 'invoices', rowKey: 'inv-0042', contains: 'Paid' } } },
  ...Object.values(JOURNEY_STEP_EXAMPLES).flat(),
];

const INVALID_STEPS = [
  'click submit',
  { click: { rowKey: 'inv-0042' } },
  { click: { control: 'ok' } },
  { click: { blockId: 'invoices', rowKey: '' } },
  { click: { blockId: 'invoices', rowKey: 42 } },
  { click: { blockId: 'delete_modal', control: '' } },
  { click: { blockId: 'invoices', rowKey: 'inv-0042', row: 0 } },
  { click: { blockId: 'delete_modal', control: 'ok', text: 'OK' } },
  { click: { blockId: 'delete_modal', control: 'ok', containing: 'OK' } },
  { click: { blockId: 'delete_modal', control: 'ok', nth: 0 } },
  { fill: { blockId: 'invoices', rowKey: 'inv-0042', column: 'name', value: 'Ada' } },
  { fill: { blockId: 'actions', control: 'name', value: 'Ada' } },
  { fill: { blockId: 'invoices', rowKey: 'inv-0042', fromEmail: { to: 'a@b.c', match: 'x' } } },
  { select: { blockId: 'invoices', rowKey: 'inv-0042', value: 'Open' } },
  { select: { blockId: 'actions', control: 'status', value: 'Open' } },
  { open: { blockId: 'invoices', rowKey: 'inv-0042' } },
  { open: { blockId: 'actions_menu', control: 'archive' } },
  { expect: { text: { blockId: 'actions_menu', control: 'archive', contains: 'Archive' } } },
  { expect: { visible: { rowKey: 'inv-0042' } } },
  { expect: { sunk: { requestId: '' } } },
  { expect: { sunk: { count: -1 } } },
  { expect: { sunk: { match: 'EUR' } } },
  { expect: { sunk: { endpoint: 'price_run' } } },
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
  { expect: { calls: { request: 'save' } } },
  { expect: { status: '403' } },
  { expect: { status: 99 } },
  { expect: { status: 403.5 } },
  { expect: { db: { collection: 'orders', match: {}, count: 1, equals: [] } } },
  { expect: { db: { collection: 'orders', match: {} } } },
  { expect: { db: { collection: 'orders', count: 1 } } },
  { expect: { db: { match: {}, count: 1 } } },
  { expect: { db: { collection: 'orders', match: {}, equals: [1] } } },
  { expect: { db: { collection: 'orders', match: [], count: 1 } } },
  { expect: { db: { collection: 'orders', match: {}, count: 1, where: {} } } },
  { call: 'orders-cancel' },
  { call: {} },
  { call: { endpoint: '' } },
  { call: { endpoint: 'e', payload: 'x' } },
  { call: { endpoint: 'e', as: ['a'] } },
  { call: { endpoint: 'e', as: '' } },
  { call: { endpoint: 'e', pageId: 'p' } },
  { request: { requestId: 'get_order' } },
  { request: { pageId: 'orders' } },
  { request: { pageId: 'orders', requestId: 'r', endpoint: 'e' } },
  { hold: 'claim_run' },
  { hold: {} },
  { hold: { requestId: '' } },
  { hold: { requestId: 'r', endpoint: 7 } },
  { hold: { requestId: 'r', times: 2 } },
  { release: '' },
  { release: { requestId: 'r', times: 2 } },
  { release: { endpoint: 'e' } },
  { release: ['r'] },
  { request: { pageId: 'orders', requestId: 'get_order', as: 'system' } },
  { request: { pageId: 'orders', requestId: 'get_order', as: { system: { organization: 'o' } } } },
  { call: { endpoint: 'nightly_close', as: { system: true } } },
  { call: { endpoint: 'nightly_close', as: { system: {} } } },
  { call: { endpoint: 'nightly_close', as: { system: { organization: '' } } } },
  { call: { endpoint: 'nightly_close', as: { system: { organization: 'o' }, id: 'u_1' } } },
  { call: { endpoint: 'nightly_close', as: { system: { organization: 'o', role: 'x' } } } },
  { call: { endpoint: 'nightly_close', as: { system: { caller: { id: 'j', name: 'J' } } } } },
  {
    call: { endpoint: 'nightly_close', as: { system: { organization: 'o', caller: { id: 'j' } } } },
  },
  { webhook: 'payment_events' },
  { webhook: { endpoint: 'payment_events' } },
  { webhook: { endpoint: '', body: {} } },
  { webhook: { endpoint: 'payment_events', body: {}, headers: { 'x-attempt': 2 } } },
  { webhook: { endpoint: 'payment_events', body: {}, query: 'a=1' } },
  { webhook: { endpoint: 'payment_events', body: {}, as: 'system' } },
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
