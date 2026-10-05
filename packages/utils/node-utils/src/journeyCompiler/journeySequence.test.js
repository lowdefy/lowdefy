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

import journeySequence from './journeySequence.js';
import stepIdentity from './stepIdentity.js';

test('stepIdentity gives clicks on the same control in different rows one identity', () => {
  const row3 = stepIdentity({ step: { click: { blockId: 'grid', row: 3, text: 'Assign' } } });
  const row7 = stepIdentity({ step: { click: { blockId: 'grid', row: 7, text: 'Assign' } } });
  expect(row3).toBe(row7);
});

test('stepIdentity tells controls with different text apart', () => {
  expect(stepIdentity({ step: { click: { blockId: 'grid', row: 3, text: 'Assign' } } })).not.toBe(
    stepIdentity({ step: { click: { blockId: 'grid', row: 3, text: 'Delete' } } })
  );
});

test('stepIdentity ignores fill and select values', () => {
  expect(stepIdentity({ step: { fill: { blockId: 'title', value: 'Ada' } } })).toBe(
    stepIdentity({ step: { fill: { blockId: 'title', value: 'Grace', from: 'recorded' } } })
  );
  expect(stepIdentity({ step: { select: { blockId: 'owner', value: 'Ada' } } })).toBe(
    stepIdentity({ step: { select: { blockId: 'owner', value: null, from: 'shape' } } })
  );
});

test('stepIdentity reads the string and object target forms the same way', () => {
  expect(stepIdentity({ step: { click: 'submit' } })).toBe(
    stepIdentity({ step: { click: { blockId: 'submit' } } })
  );
});

test('stepIdentity keeps the column and normalises list indices, but drops nth', () => {
  expect(
    stepIdentity({ step: { click: { blockId: 'rows.4.grid', row: 1, column: 'actions', nth: 2 } } })
  ).toBe('["click","rows.$.grid","actions",null]');
});

test('stepIdentity tells press chords apart and gives back one identity', () => {
  expect(stepIdentity({ step: { press: 'Enter' } })).not.toBe(
    stepIdentity({ step: { press: 'Escape' } })
  );
  expect(stepIdentity({ step: { back: true } })).toBe('["back"]');
});

test('journeySequence lists only interaction steps, on the page they happen on', () => {
  expect(
    journeySequence({
      pageId: 'tickets',
      steps: [
        { click: 'new' },
        { wait: { request: 'get_tickets' } },
        { fill: { blockId: 'title', value: 'x' } },
        { expect: { state: { path: 'title', equals: 'x' } } },
        { press: 'Enter' },
      ],
    })
  ).toEqual([
    { page: 'tickets', identity: '["click","new",null,null]' },
    { page: 'tickets', identity: '["fill","title",null,null]' },
    { page: 'tickets', identity: '["press","Enter"]' },
  ]);
});

test('journeySequence moves pages at a goto and never at an expect.url', () => {
  const sequence = journeySequence({
    pageId: 'home',
    steps: [
      { click: 'open_orders' },
      { expect: { url: { contains: '/orders' } } },
      { click: { blockId: 'orders_grid', row: 0, text: 'View' } },
      { goto: { pageId: 'settings', urlQuery: { tab: 'a' } } },
      { click: 'save' },
      { goto: 'home' },
      { back: true },
    ],
  });
  expect(sequence.map((entry) => entry.page)).toEqual(['home', 'home', 'settings', 'home']);
});

test('journeySequence reads a production-style and a dev-style segment of one flow the same', () => {
  const production = journeySequence({
    pageId: 'orders',
    steps: [
      { fill: { blockId: 'search', value: null, from: 'shape' } },
      { click: 'submit' },
      { expect: { url: { contains: '/orders/detail' } } },
      { click: { blockId: 'items.3.remove' } },
    ],
  });
  const dev = journeySequence({
    pageId: 'orders',
    steps: [
      { fill: { blockId: 'search', value: 'shoes', from: 'recorded' } },
      { expect: { state: { path: 'search', equals: 'shoes', from: 'recorded' } } },
      { click: 'submit' },
      { wait: { request: 'save_order' } },
      { expect: { url: { contains: '/orders/detail?id=o-1' } } },
      { click: { blockId: 'items.0.remove' } },
    ],
  });
  expect(dev).toEqual(production);
});

test('journeySequence reads open: x the same as click: x', () => {
  expect(journeySequence({ pageId: 'tickets', steps: [{ open: 'actions_menu' }] })).toEqual(
    journeySequence({ pageId: 'tickets', steps: [{ click: 'actions_menu' }] })
  );
});

test('journeySequence reads an open with a target as the click identity of that target', () => {
  expect(
    journeySequence({ pageId: 'tickets', steps: [{ open: { blockId: 'x', text: 'More' } }] })
  ).toEqual([
    {
      page: 'tickets',
      identity: stepIdentity({ step: { click: { blockId: 'x', text: 'More' } } }),
    },
  ]);
});

test('journeySequence does not fold an open and the option click after it into a select', () => {
  expect(
    journeySequence({
      pageId: 'tickets',
      steps: [{ open: 'owner' }, { click: { text: 'Ada' } }],
    }).map((entry) => JSON.parse(entry.identity)[0])
  ).toEqual(['click', 'click']);
});

test('journeySequence skips the steps on an email until a goto opens a page', () => {
  expect(
    journeySequence({
      pageId: 'home',
      steps: [
        { goto: 'a' },
        { fill: { blockId: 'f', value: 'x' } },
        { click: 'submit' },
        { email: { to: 'ada@example.com', subject: 'Verify your email' } },
        { click: { text: 'Verify' } },
        { goto: 'welcome' },
        { click: 'start' },
      ],
    })
  ).toEqual([
    { page: 'a', identity: '["fill","f",null,null]' },
    { page: 'a', identity: '["click","submit",null,null]' },
    { page: 'welcome', identity: '["click","start",null,null]' },
  ]);
});

test('journeySequence reads no further after an email with no later page move', () => {
  expect(
    journeySequence({
      pageId: 'signup',
      steps: [
        { click: 'submit' },
        { email: { to: 'ada@example.com' } },
        { click: { text: 'Verify' } },
        { expect: { url: { contains: '/welcome' } } },
        { click: 'start' },
      ],
    })
  ).toEqual([{ page: 'signup', identity: '["click","submit",null,null]' }]);
});

test('journeySequence reads a fill with fromEmail as a fill', () => {
  expect(
    journeySequence({
      pageId: 'verify',
      steps: [
        {
          fill: {
            blockId: 'code',
            fromEmail: { to: 'ada@example.com', match: '\\b\\d{6}\\b' },
          },
        },
      ],
    })
  ).toEqual([{ page: 'verify', identity: '["fill","code",null,null]' }]);
});

test('journeySequence reads no page from an expect.url path, which may hold path values', () => {
  const sequence = journeySequence({
    pageId: 'orders',
    steps: [
      { expect: { url: { contains: 'tab=items' } } },
      { click: 'a' },
      { expect: { url: { contains: '/' } } },
      { click: 'b' },
      { expect: { url: { contains: '/tickets/s/1' } } },
      { click: 'c' },
    ],
  });
  expect(sequence.map((entry) => entry.page)).toEqual(['orders', 'orders', 'orders']);
});
