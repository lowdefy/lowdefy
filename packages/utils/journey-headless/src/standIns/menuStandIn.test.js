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

import runTestJourney, { readLog, record } from '../tests/runTestJourney.js';

const MENU_EVENTS = { onClick: [record('onClick')], onSelect: [record('onSelect')] };

function menuPage({ properties = {} } = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'nav',
        type: 'Menu',
        properties: {
          links: [
            { id: 'home-link', pageId: 'home' },
            { id: 'reports-link', pageId: 'reports' },
            { id: 'help' },
            { id: 'locked', pageId: 'locked', properties: { disabled: true } },
            { id: 'admin', type: 'MenuGroup', links: [{ id: 'users', pageId: 'users' }] },
          ],
          ...properties,
        },
        events: MENU_EVENTS,
      },
    ],
  };
}

const REPORTS_PAGE = { id: 'reports', blocks: [{ id: 'title', type: 'Paragraph' }] };

test('Menu item for the current page fires onClick and no onSelect', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: { blockId: 'nav', control: 'home' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onClick', { key: 'home', keyPath: ['home'] }]]);
});

test('Menu item for another page fires onClick, then onSelect, then follows its link', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage(), REPORTS_PAGE],
    steps: [{ click: { blockId: 'nav', control: 'reports' } }, { expect: { visible: 'title' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onClick', { key: 'reports', keyPath: ['reports'] }],
    ['onSelect', { key: 'reports', keyPath: ['reports'] }],
  ]);
});

test('Menu item with no pageId is keyed by its id and goes nowhere', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [
      { click: { blockId: 'nav', control: 'help' } },
      { expect: { url: { contains: '/home' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual(['onClick', 'onSelect']);
});

test('Menu reads set selectedKeys from its properties', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ properties: { selectedKeys: ['help'] } })],
    steps: [{ click: { blockId: 'nav', control: 'help' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual(['onClick']);
});

test('Menu reads its links from the app menu when it has none', async () => {
  const { log, result } = await runTestJourney({
    menus: [{ menuId: 'default', links: [{ id: 'reports-link', pageId: 'reports' }] }],
    pages: [
      { id: 'home', blocks: [{ id: 'nav', type: 'Menu', events: MENU_EVENTS }] },
      REPORTS_PAGE,
    ],
    steps: [{ click: { blockId: 'nav', control: 'reports' } }, { expect: { visible: 'title' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual(['onClick', 'onSelect']);
});

test('Menu refuses a disabled item', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: { blockId: 'nav', control: 'locked' } }],
  });
  expect(result.failure.message).toBe('Item "locked" of Menu "nav" is disabled.');
  expect(log).toEqual([]);
});

test('Menu item in a submenu marks the journey browser-only', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: { blockId: 'nav', control: 'users' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Item "users" of Menu "nav" sits in a submenu, which opens in a browser.'
  );
  expect(log).toEqual([]);
});

test('Menu in horizontal mode marks any item browser-only', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ properties: { mode: 'horizontal' } })],
    steps: [{ click: { blockId: 'nav', control: 'home' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Menu "nav" is horizontal: an item can sit in its overflow menu, which depends on the window\'s width, so the click runs in a browser.'
  );
  expect(log).toEqual([]);
});

test('Menu plain click marks the journey browser-only, even with an onClick', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: 'nav' }],
  });
  expect(result.browserOnly.reason).toBe(
    'A click on Menu "nav" lands on one of its items in a browser; name the item with control to run headless.'
  );
  expect(log).toEqual([]);
});
