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

import collectFindings from './collectFindings.js';
import createConfirmations from './createConfirmations.js';
import filterSnapshotExpectations from './filterSnapshotExpectations.js';

const actionError = {
  kind: 'action-error',
  severity: 'error',
  message: 'CallAPI "assign" failed',
  pageId: 'ticket',
  source: 'pages/ticket.yaml:88',
  key: 'action-error|ticket|pages/ticket.yaml:88',
  step: 1,
};
const deadClick = {
  kind: 'dead-click',
  severity: 'warning',
  message: 'dead',
  pageId: 'ticket',
  key: 'dead',
  step: 0,
};

test('findings are one per key with the walks and users that hit them, and confirmed by key', () => {
  const logs = [
    {
      walk: 'walk-1',
      user: 'admin',
      steps: [{ index: 1, screenshot: 'shot.png' }],
      findings: [actionError],
    },
    { walk: 'walk-2', user: 'member', steps: [], findings: [deadClick, actionError] },
    { walk: 'walk-3', user: 'member', steps: [], findings: [{ ...actionError, key: 'other' }] },
  ];
  const findings = collectFindings({
    logs,
    confirmations: [
      { key: actionError.key, status: 'confirmed' },
      { key: 'other', status: 'unconfirmed' },
    ],
  });
  expect(findings.map(({ key, status, walks, users }) => [key, status, walks, users])).toEqual([
    [actionError.key, 'confirmed', ['walk-1', 'walk-2'], ['admin', 'member']],
    ['dead', 'warning', ['walk-2'], ['member']],
    ['other', 'unconfirmed', ['walk-3'], ['member']],
  ]);
  expect(findings[0].screenshot).toBe('shot.png');
});

test('confirmations replay a key once, and skip the replay when the budget is out', async () => {
  let opens = 0;
  const client = {
    open: async () => {
      opens += 1;
      return { status: 200, body: { walkId: 'r', findings: [] } };
    },
    step: async () => ({ status: 200, body: { findings: [actionError] } }),
    close: async () => ({ status: 200 }),
  };
  let stop = null;
  const confirmations = createConfirmations({
    client,
    run: '20261004T120000Z-ab12cd',
    options: { data: null, liveData: false, allowExternal: [] },
    shouldStop: () => stop,
  });
  const target = { pageId: 'ticket', user: null, roles: [], matrixListed: false };
  const log = (walk) => ({
    walk,
    steps: [
      { index: 0, step: { click: { blockId: 'a' } } },
      { index: 1, step: { click: { blockId: 'b' } } },
    ],
    findings: [actionError],
  });
  await confirmations.afterWalk({ log: log('walk-1'), target });
  await confirmations.afterWalk({ log: log('walk-2'), target });
  stop = 'budget';
  await confirmations.afterWalk({
    log: { ...log('walk-3'), findings: [{ ...actionError, key: 'new' }] },
    target,
  });
  await confirmations.afterWalk({
    log: { walk: 'walk-4', steps: [], findings: [deadClick] },
    target,
  });
  expect(opens).toBe(1);
  expect(confirmations.list().map(({ walk, status }) => [walk, status])).toEqual([
    ['walk-1', 'confirmed'],
    ['walk-2', 'confirmed'],
    ['walk-3', 'unconfirmed'],
  ]);
  expect([...confirmations.findingsByWalk.keys()]).toEqual(['walk-1', 'walk-2']);
});

test('on a snapshot data set an expect.state holding a snapshot value is dropped; fixture, typed, boolean and null values are kept', () => {
  const known = new Set(['Fixture ticket']);
  const journey = {
    pageId: 'ticket',
    steps: [
      { fill: { blockId: 'title', value: 'Explorer title 0' } },
      { expect: { state: { path: 'title', equals: 'Explorer title 0' } } },
      { expect: { state: { path: 'customer', equals: 'Staging Customer Ltd' } } },
      {
        expect: {
          state: { path: 'ticket', equals: { title: 'Fixture ticket', open: true, owner: null } },
        },
      },
      { expect: { state: { path: 'count', equals: 41 } } },
      { click: 'save' },
    ],
  };
  const {
    journey: filtered,
    comments,
    dropped,
  } = filterSnapshotExpectations({
    journey,
    comments: new Map([[5, 'failed here']]),
    knownTextFor: ({ typed }) => ({ has: (text) => known.has(text) || typed.includes(text) }),
  });
  expect(filtered.steps).toEqual([
    journey.steps[0],
    journey.steps[1],
    journey.steps[3],
    journey.steps[5],
  ]);
  expect(dropped).toBe(2);
  expect([...comments.entries()]).toEqual([[3, 'failed here']]);
});
