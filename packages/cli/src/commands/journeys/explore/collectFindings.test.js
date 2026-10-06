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

test('findings are one per key with the walks and users that hit them, in the order walks hit them', () => {
  const logs = [
    {
      walk: 'walk-1',
      user: 'admin',
      steps: [{ index: 1, screenshot: 'shot.png' }],
      findings: [actionError],
    },
    { walk: 'walk-2', user: 'member', steps: [], findings: [deadClick, actionError] },
    { walk: 'walk-3', user: null, steps: [], findings: [{ ...actionError, key: 'other' }] },
  ];
  const findings = collectFindings({ logs });
  expect(findings.map(({ key, walks, users }) => [key, walks, users])).toEqual([
    [actionError.key, ['walk-1', 'walk-2'], ['admin', 'member']],
    ['dead', ['walk-2'], ['member']],
    ['other', ['walk-3'], ['default']],
  ]);
  expect(findings[0].screenshot).toBe('shot.png');
  expect(findings[0].step).toBe(1);
  findings.forEach((finding) => expect(finding).not.toHaveProperty('status'));
});

test('a finding at open has no step and carries the screenshot the walk took at open', () => {
  const openError = {
    kind: 'server-error',
    severity: 'error',
    message: 'Unrecognized pipeline stage name',
    pageId: 'ticket',
    source: 'pages/ticket.yaml:4',
    key: 'server-error|ticket|pages/ticket.yaml:4',
  };
  const logs = [
    {
      walk: 'walk-1',
      user: 'member',
      open: { screenshot: 'open.png' },
      steps: [{ index: 0, screenshot: 'step.png' }],
      findings: [openError],
    },
  ];
  const [finding] = collectFindings({ logs });
  expect(finding.step).toBeNull();
  expect(finding.screenshot).toBe('open.png');
});

test('one key hit by two charters is one finding listing both charters, in the order they hit it', () => {
  const charters = [
    { goal: 'Try edge input on the ticket form.' },
    { goal: 'Try error paths on the ticket form.' },
    { goal: 'Try the settings page.' },
  ];
  const logs = [
    { walk: 'walk-1', user: 'admin', charter: 1, steps: [], findings: [actionError] },
    { walk: 'walk-2', user: 'admin', charter: 2, steps: [], findings: [deadClick] },
    { walk: 'walk-3', user: 'member', charter: 0, steps: [], findings: [actionError] },
    { walk: 'walk-4', user: 'member', charter: 1, steps: [], findings: [actionError] },
  ];
  const findings = collectFindings({ logs, charters });
  expect(findings).toHaveLength(2);
  expect(findings[0]).toMatchObject({
    key: actionError.key,
    walks: ['walk-1', 'walk-3', 'walk-4'],
    users: ['admin', 'member'],
    charters: ['Try error paths on the ticket form.', 'Try edge input on the ticket form.'],
  });
  expect(findings[1]).toMatchObject({ key: 'dead', charters: ['Try the settings page.'] });
});

test('a run without charters lists none on its findings', () => {
  const logs = [{ walk: 'walk-1', user: 'admin', charter: null, steps: [], findings: [deadClick] }];
  expect(collectFindings({ logs })[0].charters).toEqual([]);
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
