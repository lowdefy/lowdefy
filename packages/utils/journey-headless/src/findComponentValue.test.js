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

const PAGE = {
  id: 'home',
  blocks: [
    {
      id: 'board',
      type: 'Table',
      properties: { data: [{ id: 'a' }], defaultView: { collapsedGroups: ['a'] } },
    },
    { id: 'filters', type: 'Box', blocks: [{ id: 'filters.name', type: 'TextInput' }] },
    { id: 'go', type: 'Button', events: { onClick: [record('go')] } },
  ],
};

test("expect.state into a Table's value runs in a browser, which writes it", async () => {
  const { result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ expect: { state: { path: 'board.view.collapsedGroups', equals: ['a'] } } }],
  });
  expect(result.browserOnly).toEqual({
    index: 0,
    reason:
      'State "board.view.collapsedGroups" reads the value of Table "board", which its component writes in a browser and a headless run does not model: the step runs in a browser.',
    step: { expect: { state: { path: 'board.view.collapsedGroups', equals: ['a'] } } },
  });
});

test('expect.state on the Table value itself, or a bracketed path into it, runs in a browser', async () => {
  for (const path of ['board', 'board.selection[0]']) {
    const { result } = await runTestJourney({
      pages: [PAGE],
      steps: [{ expect: { state: { path, equals: null } } }],
    });
    expect(result.browserOnly.reason).toContain('reads the value of Table "board"');
  }
});

test('expect.state elsewhere reads the state headless', async () => {
  const { log, result } = await runTestJourney({
    pages: [PAGE],
    steps: [
      { fill: { blockId: 'filters.name', value: 'Ada' } },
      { expect: { state: { path: 'filters.name', equals: 'Ada' } } },
      { expect: { state: { path: 'boardroom', equals: null } } },
      { click: 'go' },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['go']]);
});

test("wait.state on a Table's value runs in a browser too", async () => {
  const { result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ wait: { state: 'board.view' } }],
  });
  expect(result.browserOnly.reason).toContain('reads the value of Table "board"');
});
