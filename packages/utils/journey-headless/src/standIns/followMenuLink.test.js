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

// A menu item link with `newTab` opens another tab in the browser and leaves the journey's page
// where it is, so headless fires the item's events and follows nothing. `newTab` is read from the
// link and from its properties, as the item's Link reads it.

const REPORTS_PAGE = { id: 'reports', blocks: [{ id: 'title', type: 'Paragraph' }] };

function linksPage() {
  return {
    id: 'home',
    blocks: [
      {
        id: 'menu',
        type: 'DropdownMenu',
        properties: { links: [{ id: 'reports', pageId: 'reports', newTab: true }] },
        events: { onClick: [record('onClick')] },
        blocks: [{ id: 'menu_label', type: 'Paragraph' }],
      },
      {
        id: 'nav',
        type: 'Menu',
        properties: {
          links: [{ id: 'reports-link', pageId: 'reports', properties: { newTab: true } }],
        },
        events: { onClick: [record('onClick')], onSelect: [record('onSelect')] },
      },
    ],
  };
}

test('DropdownMenu item with a newTab link fires its events and stays on the page', async () => {
  const { log, result } = await runTestJourney({
    pages: [linksPage(), REPORTS_PAGE],
    steps: [
      { click: { blockId: 'menu', control: 'reports' } },
      { expect: { url: { contains: '/home' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).filter(([name]) => name === 'onClick')).toEqual([
    ['onClick', { key: 'reports', keyPath: ['reports'], pageId: 'reports' }],
  ]);
});

test('Menu item with newTab in its link properties fires its events and stays on the page', async () => {
  const { log, result } = await runTestJourney({
    pages: [linksPage(), REPORTS_PAGE],
    steps: [
      { click: { blockId: 'nav', control: 'reports' } },
      { expect: { url: { contains: '/home' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onClick', { key: 'reports', keyPath: ['reports'] }],
    ['onSelect', { key: 'reports', keyPath: ['reports'] }],
  ]);
});
