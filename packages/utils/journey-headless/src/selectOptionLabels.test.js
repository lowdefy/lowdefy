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

import runTestJourney, { readLog, record } from './tests/runTestJourney.js';

// The first test in this file is the first html label its worker reads, so the DOM loads during
// the step, as on the first select of a run: the order of the events must not depend on it.
function spacePage({ spaces }) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'company',
        type: 'Selector',
        properties: { options: ['Audit Avis', 'Audit Bravo'] },
        events: { onSearch: [record('company.onSearch')] },
      },
      {
        id: 'space',
        type: 'Selector',
        properties: { options: spaces },
        events: { onChange: [record('space.onChange')] },
      },
      {
        id: 'tier',
        type: 'RadioSelector',
        properties: { options: [{ label: '<b>Gold</b> tier', value: 'gold' }] },
        events: { onChange: [record('tier.onChange')] },
      },
    ],
  };
}

const SPACES = [
  { label: '<span class="dot"></span><span>No space</span>', value: 'none' },
  { label: '<span class="dot"></span><span>Sales</span>', value: 'sales' },
];

test("another selector's closing onSearch starts before a select's onChange, on the first read of html too", async () => {
  const { log, result } = await runTestJourney({
    pages: [spacePage({ spaces: SPACES })],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { select: { blockId: 'space', value: 'Sales' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['company.onSearch', { value: 'Audit' }],
    ['company.onSearch', { value: '' }],
    ['space.onChange', { value: 'sales' }],
  ]);
});

test("a radio select is one click, so its onChange starts before another selector's closing onSearch", async () => {
  const { log, result } = await runTestJourney({
    pages: [spacePage({ spaces: SPACES })],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { select: { blockId: 'tier', value: 'Gold tier' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['company.onSearch', { value: 'Audit' }],
    ['tier.onChange', { value: 'gold' }],
    ['company.onSearch', { value: '' }],
  ]);
});

test('a select on a selector whose label an enhancer writes the text of needs the browser', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      spacePage({
        spaces: [
          ...SPACES,
          { label: '<span data-avatar="Ada Lovelace"></span> Ada', value: 'ada' },
        ],
      }),
    ],
    steps: [{ select: { blockId: 'space', value: 'Sales' } }],
  });
  expect(result.browserOnly).toEqual({
    index: 0,
    reason:
      'Block "space" (Selector) has an option label whose text data-avatar, data-format or data-time writes in the browser, which a headless select does not model: the step runs in a browser.',
    step: { select: { blockId: 'space', value: 'Sales' } },
  });
  expect(log).toEqual([]);
});

test('data-format and data-time labels need the browser too', async () => {
  for (const label of [
    '<span data-format="currency">1200</span>',
    '<time data-time="relative" datetime="2026-11-20">20 Nov</time>',
  ]) {
    const { result } = await runTestJourney({
      pages: [spacePage({ spaces: [{ label, value: 'x' }] })],
      steps: [{ select: { blockId: 'space', value: 'x' } }],
    });
    expect(result.browserOnly?.index).toBe(0);
  }
});
