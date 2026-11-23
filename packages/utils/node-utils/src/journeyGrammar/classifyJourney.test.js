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

import { expect, test } from 'vitest';

import classifyJourney from './classifyJourney.js';

function classify(steps) {
  return classifyJourney({ journey: { pageId: 'home', steps } });
}

test('classifyJourney calls a journey of block-id steps and engine checks headless', () => {
  expect(
    classify([
      { select: { blockId: 'kind', value: 'Item' } },
      { fill: { blockId: 'name_input', value: 'Ada' } },
      { expect: { state: { path: 'name_input', equals: 'Ada' } } },
      { press: 'Enter' },
      { click: 'save_button' },
      { click: { blockId: 'save_button' } },
      { wait: 100 },
      { wait: { request: 'save_item' } },
      { wait: { state: 'saved' } },
      { goto: 'second' },
      { back: true },
      { as: 'auditor' },
      { expect: { state: { path: 'saved', equals: true } } },
      { expect: { visible: 'save_success' } },
      { expect: { hidden: { blockId: 'hidden_text' } } },
      { expect: { calls: { request: 'save_item', count: 1 } } },
      { expect: { url: { contains: 'second' } } },
    ])
  ).toEqual({ headless: true });
});

test('classifyJourney calls call, request and their checks headless', () => {
  expect(
    classify([
      { call: { endpoint: 'notify', payload: {} } },
      { expect: { status: 403 } },
      { expect: { error: 'Not allowed' } },
      { request: { pageId: 'home', requestId: 'save_item', payload: { name: 'x' } } },
      { expect: { db: { collection: 'items', match: {}, count: 1 } } },
      { expect: { calls: { endpoint: 'notify', payload: {} } } },
    ])
  ).toEqual({ headless: true });
});

test.each([
  ['screenshot', { screenshot: 'home' }, 'step "screenshot" needs a browser'],
  ['email', { email: { to: 'a@example.com' } }, 'step "email" needs a browser'],
  [
    'press other than Enter',
    { press: 'Escape' },
    'press "Escape" needs a browser; a headless run presses only Enter',
  ],
])('classifyJourney names a %s step as needing the browser', (_, step, reason) => {
  expect(classify([{ click: 'a' }, step])).toEqual({ headless: false, index: 1, step, reason });
});

test.each([
  ['a click', [{ fill: { blockId: 'name_input', value: 'Ada' } }, { click: 'save_button' }]],
  ['a select', [{ select: { blockId: 'kind', value: 'Item' } }]],
  ['no step', []],
])('classifyJourney names press Enter after %s as needing the browser', (_, before) => {
  const step = { press: 'Enter' };
  expect(classify([...before, step])).toEqual({
    headless: false,
    index: before.length,
    step,
    reason: 'press "Enter" needs a browser unless a fill comes straight before it',
  });
});

const DOM_TARGET_REASONS = {
  text: 'a target by text reads the page; name the control with control on its block',
  containing: 'a target by "containing" reads the page; a headless run targets blocks by blockId',
  row: 'a target by row reads the displayed order; name the row with rowKey to run headless',
  column: 'a target by "column" reads the page; a headless run targets blocks by blockId',
  nth: 'a target by "nth" reads the page; a headless run targets blocks by blockId',
};

test.each(Object.keys(DOM_TARGET_REASONS))(
  'classifyJourney names a target by %s as needing the browser',
  (key) => {
    const value = ['row', 'nth'].includes(key) ? 0 : 'x';
    const step = { click: { blockId: 'grid', [key]: value } };
    expect(classify([step])).toEqual({
      headless: false,
      index: 0,
      step,
      reason: DOM_TARGET_REASONS[key],
    });
  }
);

test('classifyJourney calls hold and release headless and marks the first as needing the runner in process', () => {
  const steps = [
    { call: { endpoint: 'notify', payload: {} } },
    { hold: { requestId: 'claim_run' } },
    { call: { endpoint: 'approve', payload: {} } },
    { release: 'claim_run' },
    { expect: { status: 200 } },
  ];
  expect(classify(steps)).toEqual({
    headless: true,
    inProcess: {
      index: 1,
      step: { hold: { requestId: 'claim_run' } },
      reason:
        'step "hold" needs the headless runner, which keeps a held call parked in its own process',
    },
  });
});

test('classifyJourney calls a call as system and a webhook headless, and marks the call as needing the runner in process', () => {
  const steps = [
    { webhook: { endpoint: 'payment_events', body: { id: 'evt_1' } } },
    { expect: { status: 200 } },
    { call: { endpoint: 'nightly_close', as: 'system' } },
    { expect: { db: { collection: 'items', match: {}, count: 1 } } },
  ];
  expect(classify(steps)).toEqual({
    headless: true,
    inProcess: {
      index: 2,
      step: { call: { endpoint: 'nightly_close', as: 'system' } },
      reason:
        'step "call" as system needs the headless runner, which runs the endpoint as the system in its own process; over HTTP that is the detached route, which needs CRON_SECRET',
    },
  });
  expect(classify(steps.slice(0, 2))).toEqual({ headless: true });
});

test('classifyJourney keeps inProcess on a journey that also needs the browser', () => {
  expect(
    classify([{ hold: { requestId: 'claim_run' } }, { click: { text: 'Save' } }])
  ).toMatchObject({
    headless: false,
    index: 1,
    inProcess: { index: 0, step: { hold: { requestId: 'claim_run' } } },
  });
});

test('classifyJourney names a visible check by text as needing the browser', () => {
  const step = { expect: { visible: { text: 'Saved' } } };
  expect(classify([step]).reason).toBe(
    'a target by text reads the page; name the control with control on its block'
  );
});

test('classifyJourney calls rowKey, control and open targets headless', () => {
  const steps = [
    { open: 'actions_menu' },
    { click: { blockId: 'actions_menu', control: 'archive' } },
    { click: { blockId: 'invoices', rowKey: 'inv-0042' } },
    { click: { blockId: 'invoices', rowKey: 'inv-0042', column: 'number' } },
    { click: { blockId: 'invoices', rowKey: 'inv-0042', column: 'actions', control: 'void' } },
    { click: { blockId: 'delete_modal', control: 'ok' } },
    { expect: { hidden: { blockId: 'invoices', rowKey: 'inv-0042' } } },
    { expect: { visible: { blockId: 'invoices', rowKey: 'inv-0043', column: 'number' } } },
    { click: { blockId: 'issue_cards', control: 'onOpen', rowKey: 'issue-17' } },
    { expect: { hidden: { blockId: 'issue_cards', control: 'onOpen', rowKey: 'issue-17' } } },
  ];
  expect(classify(steps)).toEqual({ headless: true });
});

test('classifyJourney names an open by text as needing the browser', () => {
  const step = { open: { text: 'More' } };
  expect(classify([step]).reason).toBe(
    'a target by text reads the page; name the control with control on its block'
  );
});

test('classifyJourney names a column without rowKey as needing the browser, also on an expectation', () => {
  const step = { expect: { hidden: { blockId: 'invoices', column: 'number' } } };
  expect(classify([step]).reason).toBe(
    'a target by "column" reads the page; a headless run targets blocks by blockId'
  );
});

test.each(['text', 'title', 'effect'])(
  'classifyJourney names expect %s as needing the browser',
  (key) => {
    const values = {
      text: { blockId: 'a', contains: 'x' },
      title: { equals: 'x' },
      effect: true,
    };
    const step = { expect: { [key]: values[key] } };
    expect(classify([{ click: 'a' }, step])).toEqual({
      headless: false,
      index: 1,
      step,
      reason: `expect "${key}" reads the page in a browser`,
    });
  }
);

test('classifyJourney names a fill from an email and a double click as needing the browser', () => {
  expect(
    classify([{ fill: { blockId: 'code', fromEmail: { to: 'a@example.com', match: '\\d+' } } }])
      .reason
  ).toBe('a fill from an email reads the mail sink in a browser journey');
  expect(classify([{ click: { blockId: 'row', count: 2 } }]).reason).toBe(
    'a double or triple click needs a browser'
  );
});

test('classifyJourney names the first step that needs the browser', () => {
  expect(
    classify([
      { click: 'a' },
      { expect: { text: { blockId: 'a', contains: 'x' } } },
      { screenshot: true },
    ]).index
  ).toBe(1);
});
