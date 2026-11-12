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
      { fill: { blockId: 'name_input', value: 'Ada' } },
      { select: { blockId: 'kind', value: 'Item' } },
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
  ['open', { open: 'kind' }, 'step "open" needs a browser'],
  [
    'press other than Enter',
    { press: 'Escape' },
    'press "Escape" needs a browser; a headless run presses only Enter',
  ],
])('classifyJourney names a %s step as needing the browser', (_, step, reason) => {
  expect(classify([{ click: 'a' }, step])).toEqual({ headless: false, index: 1, step, reason });
});

test.each(['text', 'containing', 'row', 'column', 'nth'])(
  'classifyJourney names a target by %s as needing the browser',
  (key) => {
    const value = ['row', 'nth'].includes(key) ? 0 : 'x';
    const step = { click: { blockId: 'grid', [key]: value } };
    expect(classify([step])).toEqual({
      headless: false,
      index: 0,
      step,
      reason: `a target by "${key}" reads the page; a headless run targets blocks by blockId`,
    });
  }
);

test('classifyJourney names a visible check by text as needing the browser', () => {
  const step = { expect: { visible: { text: 'Saved' } } };
  expect(classify([step]).reason).toBe(
    'a target by "text" reads the page; a headless run targets blocks by blockId'
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
