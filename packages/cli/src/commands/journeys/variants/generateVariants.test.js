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

import buildVariantJourney from './buildVariantJourney.js';
import checkJourneyItem from '../../test/checkJourneyItem.js';
import expandJourney from '../../test/expandJourney.js';
import generateVariants from './generateVariants.js';

const dataSet = {
  name: 'tickets',
  fixtures: {
    tickets: [
      { _id: 't1', organizationId: 'org_a', title: 'Printer jam', status: 'open' },
      { _id: 't2', organizationId: 'org_a', title: 'Broken chair', status: 'open' },
      { _id: 't3', organizationId: 'org_b', title: 'Leaking tap', status: 'open' },
    ],
  },
  users: {
    member: { id: 'u_1', roles: ['member'], organizationId: 'org_a' },
    admin: { id: 'u_2', roles: ['admin'], organizationId: 'org_a' },
    viewer: { id: 'u_3', roles: ['viewer'], organizationId: 'org_a' },
    outsider: { id: 'u_9', roles: ['member'], organizationId: 'org_b' },
  },
};

const pageConfigs = [{ blockId: 'tickets', auth: { public: false } }];

const cases = [
  { name: 'member', user: 'member', ticket: 'Printer jam' },
  { name: 'admin', user: 'admin', ticket: 'Broken chair' },
];

const journey = {
  name: 'closes a ticket',
  pageId: 'tickets',
  data: 'tickets',
  user: { _case: 'user' },
  cases,
  steps: [
    { click: 'filter_open' },
    { click: { blockId: 'grid', containing: { _case: 'ticket' } } },
    { click: 'close' },
  ],
};

function generate(kinds, extra = {}, requests = []) {
  return generateVariants({
    kinds,
    journey,
    exercised: { pages: ['tickets'], requests, endpoints: [] },
    inputs: { dataSet, roleMatrix: null, pageConfigs, ...extra },
  });
}

test('a role variant of a case-table journey grants each row a role set its own user lacks', () => {
  const { variants, skipped } = generate(['role']);
  expect(skipped).toEqual([]);
  expect(variants.map(({ detail, overrides }) => [detail, overrides])).toEqual([
    ['granted to admin [admin], row member', { user: 'admin', cases: [cases[0]] }],
    ['granted to viewer [viewer]', { user: 'viewer', cases }],
    ['granted to member [member], row admin', { user: 'member', cases: [cases[1]] }],
  ]);
  variants.forEach((variant) => {
    expect(variant.steps).toEqual(journey.steps);
    expect(variant.comments[0]).toBe(
      `Passes? Keep ${variant.overrides.user} as rows of "closes a ticket", not a copy: add these rows to its cases with user: ${variant.overrides.user}, renamed, and delete this file.`
    );
  });
  const viewer = buildVariantJourney({ journey, variant: variants[1] });
  const runs = expandJourney({ item: { filePath: 'v.yaml', journeyIndex: 0, journey: viewer } });
  expect(runs.map((run) => [run.journey.name, run.journey.user])).toEqual([
    ['closes a ticket — role: granted to viewer [viewer] [member]', 'viewer'],
    ['closes a ticket — role: granted to viewer [viewer] [admin]', 'viewer'],
  ]);
  expect(runs.map((run) => run.journey.steps[1].click.containing)).toEqual([
    'Printer jam',
    'Broken chair',
  ]);
  runs.forEach((run) => expect(checkJourneyItem({ item: run })).toBeUndefined());
});

test("a tenant variant of a case-table journey reads each row's user and hides that row's values", () => {
  const { variants, skipped } = generate(['tenant']);
  expect(skipped).toEqual([
    {
      kind: 'tenant',
      note: 'the call form replays the payloads a headless run records, and this journey needs a browser',
    },
  ]);
  expect(variants).toEqual([
    {
      kind: 'tenant',
      detail: 'as outsider of org_b, row member',
      overrides: { user: 'outsider', cases: [cases[0]] },
      steps: [
        journey.steps[0],
        { expect: { visible: { blockId: 'grid', containing: 'Leaking tap' } } },
        { expect: { hidden: { blockId: 'grid', containing: 'Printer jam' } } },
      ],
    },
    {
      kind: 'tenant',
      detail: 'as outsider of org_b, row admin',
      overrides: { user: 'outsider', cases: [cases[1]] },
      steps: [
        journey.steps[0],
        { expect: { visible: { blockId: 'grid', containing: 'Leaking tap' } } },
        { expect: { hidden: { blockId: 'grid', containing: 'Broken chair' } } },
      ],
    },
  ]);
  const built = buildVariantJourney({ journey, variant: variants[1] });
  const runs = expandJourney({ item: { filePath: 'v.yaml', journeyIndex: 0, journey: built } });
  expect(runs.map((run) => [run.journey.name, run.journey.user])).toEqual([
    ['closes a ticket — tenant: as outsider of org_b, row admin [admin]', 'outsider'],
  ]);
  runs.forEach((run) => expect(checkJourneyItem({ item: run })).toBeUndefined());
});

test('a tenant variant of a case-table journey names the rows a skip note holds for', () => {
  const mixed = [
    { name: 'member', user: 'member', ticket: 'Printer jam' },
    { name: 'guest', user: { roles: ['member'] }, ticket: 'Broken chair' },
  ];
  const { variants, skipped } = generateVariants({
    kinds: ['tenant'],
    journey: { ...journey, cases: mixed },
    exercised: { pages: ['tickets'], requests: [], endpoints: [] },
    inputs: { dataSet, roleMatrix: null, pageConfigs },
  });
  expect(variants.map(({ detail }) => detail)).toEqual(['as outsider of org_b, row member']);
  expect(skipped.map(({ note }) => note)).toEqual([
    "row guest: the journey's user has no organizationId",
    'the call form replays the payloads a headless run records, and this journey needs a browser',
  ]);
});

test('the tenant call form of a case-table journey reads the first row, whose run it replays', () => {
  const { variants } = generate(
    ['tenant'],
    {
      calls: [
        {
          actor: 'main',
          kind: 'request',
          pageId: 'tickets',
          requestId: 'close',
          payload: { ticketId: 't1' },
        },
      ],
      collections: { tickets: 'tickets' },
    },
    [{ pageId: 'tickets', requestId: 'close', write: true }]
  );
  const calls = variants.filter(({ detail }) => detail.startsWith('writes sent'));
  expect(calls.map(({ detail, overrides }) => [detail, overrides.user, overrides.cases])).toEqual([
    ['writes sent as outsider of org_b, row member', 'outsider', [cases[0]]],
  ]);
});

test('generateVariants reads a journey with no case table as written', () => {
  const plain = { ...journey, user: 'member', cases: undefined, steps: journey.steps.slice(0, 1) };
  const { variants } = generateVariants({
    kinds: ['role'],
    journey: plain,
    exercised: { pages: ['tickets'], requests: [], endpoints: [] },
    inputs: { dataSet, roleMatrix: null, pageConfigs },
  });
  expect(variants.map(({ detail, overrides }) => [detail, overrides])).toEqual([
    ['granted to admin [admin]', { user: 'admin' }],
    ['granted to viewer [viewer]', { user: 'viewer' }],
  ]);
});
