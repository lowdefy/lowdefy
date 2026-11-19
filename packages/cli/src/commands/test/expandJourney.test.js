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

import checkJourneyItem from './checkJourneyItem.js';
import collapseRuns from './collapseRuns.js';
import expandJourney from './expandJourney.js';
import measuredJourney from './measuredJourney.js';

const filePath = '/app/tests/journeys/a.yaml';

function item(journey) {
  return { filePath, journeyIndex: 0, journey };
}

const table = {
  name: 'refuses another company',
  data: 'support',
  user: 'client_a',
  cases: [
    { name: 'ticket', endpoint: 'tickets-add-comment', payload: { ticket_id: 'T-B-1' } },
    { name: 'workflow', endpoint: 'workflow-submit', payload: { action_id: 'A-B-1' } },
    { name: 'note', endpoint: 'notes-add', payload: { note_id: 'N-B-1' } },
  ],
  steps: [
    { call: { endpoint: { _case: 'endpoint' }, payload: { _case: 'payload' } } },
    { expect: { status: 400 } },
  ],
};

test('expandJourney expands a 3-row case table into 3 runs named for their rows', () => {
  const runs = expandJourney({ item: item(table) });
  expect(runs.map((run) => run.journey.name)).toEqual([
    'refuses another company [ticket]',
    'refuses another company [workflow]',
    'refuses another company [note]',
  ]);
  expect(runs[1]).toEqual({
    filePath,
    journeyIndex: 0,
    journey: {
      name: 'refuses another company [workflow]',
      data: 'support',
      user: 'client_a',
      steps: [
        { call: { endpoint: 'workflow-submit', payload: { action_id: 'A-B-1' } } },
        { expect: { status: 400 } },
      ],
    },
    expandedFrom: table,
  });
  runs.forEach((run) => expect(checkJourneyItem({ item: run })).toBeUndefined());
});

test('expandJourney fills _case in user, data, pageId and inside a payload', () => {
  const journey = {
    name: 'saves as each role',
    pageId: { _case: 'page' },
    data: { _case: 'data' },
    user: { _case: 'user' },
    cases: [
      { name: 'admin', page: 'orders', data: 'shop', user: 'admin', quantity: 2 },
      { name: 'clerk', page: 'refunds', data: 'shop-small', user: 'clerk', quantity: 5 },
    ],
    steps: [
      {
        call: { endpoint: 'orders-save', payload: { order: { quantity: { _case: 'quantity' } } } },
      },
      { expect: { status: 200 } },
    ],
  };
  const runs = expandJourney({ item: item(journey) }).map((run) => run.journey);
  expect(runs.map(({ pageId, data, user }) => ({ pageId, data, user }))).toEqual([
    { pageId: 'orders', data: 'shop', user: 'admin' },
    { pageId: 'refunds', data: 'shop-small', user: 'clerk' },
  ]);
  expect(runs[1].steps[0]).toEqual({
    call: { endpoint: 'orders-save', payload: { order: { quantity: 5 } } },
  });
});

test('expandJourney keeps naming a user list run for its user, with expandedFrom', () => {
  const journey = { name: 'edits', pageId: 'form', data: 'tickets', user: ['admin', 'member'] };
  const written = { ...journey, steps: [{ click: 'submit' }] };
  const runs = expandJourney({ item: item(written) });
  expect(runs.map((run) => run.journey.name)).toEqual(['edits [admin]', 'edits [member]']);
  expect(runs.map((run) => run.journey.user)).toEqual(['admin', 'member']);
  runs.forEach((run) => expect(run.expandedFrom).toBe(written));
});

test.each([
  [
    'a user list beside cases',
    { ...table, user: ['client_a', 'client_b'] },
    'Journey has "cases" and a list of users: write a row per user',
  ],
  [
    'a _case that fills user with a list',
    {
      ...table,
      user: { _case: 'users' },
      cases: [{ name: 'both', users: ['client_a', 'client_b'], endpoint: 'x', payload: {} }],
    },
    'Journey case "both" fills user with a list: write a row per user',
  ],
  [
    'a _case naming a key the row lacks',
    { ...table, cases: [{ name: 'ticket', endpoint: 'tickets-add-comment' }] },
    'Journey case "ticket" has no "payload" for _case to read.',
  ],
  [
    'two rows with one name',
    { ...table, cases: [table.cases[0], table.cases[0]] },
    'Journey "cases" has two rows named "ticket"; row names are unique.',
  ],
  [
    'a row with no name',
    { ...table, cases: [{ endpoint: 'x', payload: {} }] },
    'Journey "cases" rows should each have a "name".',
  ],
  ['an empty table', { ...table, cases: [] }, 'Journey "cases" should have at least one row.'],
  [
    'a row whose filled-in run is invalid',
    { ...table, cases: [{ name: 'ticket', endpoint: 5, payload: {} }] },
    'Journey case "ticket": ',
  ],
])(
  'expandJourney leaves a journey with %s whole, for the runner to refuse once',
  (_, journey, message) => {
    const runs = expandJourney({ item: item(journey) });
    expect(runs).toEqual([item(journey)]);
    const refused = checkJourneyItem({ item: runs[0] });
    expect(refused).toMatchObject({ name: 'refuses another company', refused: true });
    expect(refused.message).toContain(`Invalid journey file: ${message}`);
  }
);

test('expandJourney does not apply the name limit to a row run name', () => {
  const runs = expandJourney({ item: item({ ...table, name: 'a'.repeat(100) }) });
  expect(runs).toHaveLength(3);
  runs.forEach((run) => expect(checkJourneyItem({ item: run })).toBeUndefined());
});

test('collapseRuns reads a case table once, as its first selected run, and a user list as written', () => {
  const personas = {
    name: 'edits',
    pageId: 'form',
    data: 'tickets',
    user: ['admin', 'member'],
    steps: [{ click: 'submit' }],
  };
  const runs = [
    ...expandJourney({ item: item(table) }),
    ...expandJourney({ item: { ...item(personas), journeyIndex: 1 } }),
  ];
  const collapsed = collapseRuns({ items: runs });
  expect(collapsed).toEqual([runs[0], { filePath, journeyIndex: 1, journey: personas }]);
  expect(collapseRuns({ items: runs.slice(1) })[0].journey.name).toBe(
    'refuses another company [workflow]'
  );
});

test('measuredJourney is the first run of a case table and of a user list', () => {
  expect(measuredJourney({ journey: table }).name).toBe('refuses another company [ticket]');
  expect(
    measuredJourney({
      journey: { name: 'edits', data: 'tickets', user: ['admin', 'member'], steps: [] },
    }).name
  ).toBe('edits [admin]');
});

test.each([
  ['a case table', table],
  [
    'a user list',
    {
      name: 'refuses another company',
      pageId: 'form',
      data: 'support',
      user: ['client_a', 'client_b'],
      steps: [{ click: 'submit' }],
    },
  ],
])('an unknown root key on %s is refused once, naming the journey', (_, journey) => {
  const runs = expandJourney({ item: item({ ...journey, seriel: true }) });
  expect(runs).toEqual([item({ ...journey, seriel: true })]);
  const refused = runs.map((run) => checkJourneyItem({ item: run }));
  expect(refused).toHaveLength(1);
  expect(refused[0]).toMatchObject({
    name: 'refuses another company',
    passed: false,
    refused: true,
  });
  expect(refused[0].message).toMatch(
    /^Invalid journey file: Journey has an unknown key "seriel"\. Keys are: /
  );
});
