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

import computeEvidence from './computeEvidence.js';

const window = { from: '2026-09-03', to: '2026-10-02' };
const today = '2026-10-03';

function identity(verb, blockId) {
  return JSON.stringify([verb, blockId, null, null]);
}

function segment({ session, page = 'tickets', steps, persons = [], orgs = [], failure }) {
  return {
    session,
    page_id: page,
    sequence: steps.map((blockId) => ({ page, identity: identity('click', blockId) })),
    persons,
    orgs,
    failure,
  };
}

const journey = {
  name: 'saves a ticket',
  pageId: 'tickets',
  steps: [{ click: 'edit' }, { click: 'save' }],
};

const segments = [
  segment({ session: 's1', steps: ['edit', 'title', 'save'], persons: ['p_1'], orgs: ['o_1'] }),
  segment({
    session: 's2',
    steps: ['edit', 'save', 'edit', 'save'],
    persons: ['p_2'],
    orgs: ['o_1'],
  }),
  segment({
    session: 's3',
    steps: ['edit', 'save'],
    persons: ['p_1'],
    orgs: ['o_2'],
    failure: 'tickets.save.onClick',
  }),
  segment({ session: 's4', steps: ['save', 'edit'], persons: ['p_3'] }),
  segment({ session: 's5', page: 'home', steps: ['open'], persons: ['p_4'] }),
  segment({ session: 's6', steps: ['close'], persons: ['p_5'] }),
];

function compute(entry, sources = { production: { segments, window } }) {
  return computeEvidence({
    journeys: [
      {
        filePath: '/app/tests/journeys/t.yaml',
        file: 'tests/journeys/t.yaml',
        journeyIndex: 0,
        journey: entry,
      },
    ],
    sources,
    today,
  })[0];
}

test('computeEvidence counts backing sessions once each, distinct persons and orgs, share and failures', () => {
  const result = compute(journey);
  expect(result.after).toEqual({
    production: {
      sessions: 3,
      persons: 2,
      orgs: 2,
      share: 0.6,
      failures: 1,
      window: '2026-09-03/2026-10-02',
    },
    refreshed: '2026-10-03',
  });
  expect(result.changed).toBe(true);
});

test('computeEvidence gives orgs 0 for a single-tenant window', () => {
  const single = segments.map((entry) => ({ ...entry, orgs: [] }));
  expect(compute(journey, { production: { segments: single, window } }).after.production.orgs).toBe(
    0
  );
});

test('computeEvidence rounds share to 2 decimals', () => {
  const three = [
    segment({ session: 'a', steps: ['edit', 'save'] }),
    segment({ session: 'b', steps: ['x'] }),
    segment({ session: 'c', steps: ['y'] }),
  ];
  expect(compute(journey, { production: { segments: three, window } }).after.production.share).toBe(
    0.33
  );
});

test('computeEvidence keeps committed dev, explorer and mutation when their sources are absent', () => {
  const committed = {
    dev: { recordings: 2 },
    explorer: { prs: [2531] },
    mutation: { killed: 11, total: 12, unique: 2 },
    refreshed: '2026-09-01',
  };
  const result = compute({ ...journey, evidence: committed });
  expect(result.after).toEqual({
    production: expect.any(Object),
    dev: { recordings: 2 },
    explorer: { prs: [2531] },
    mutation: { killed: 11, total: 12, unique: 2 },
    refreshed: '2026-10-03',
  });
});

test('computeEvidence never adds mutation without a report', () => {
  expect(compute(journey).after).not.toHaveProperty('mutation');
});

test('computeEvidence leaves a journey unchanged, refreshed included, when nothing moved', () => {
  const first = compute(journey);
  const second = compute({ ...journey, evidence: first.after });
  expect(second.changed).toBe(false);
  expect(second.after).toEqual(first.after);
  expect(second.after.refreshed).toBe('2026-10-03');
});

test('computeEvidence keeps everything committed when no source is present', () => {
  const committed = { dev: { recordings: 1 }, refreshed: '2026-09-01' };
  const result = compute({ ...journey, evidence: committed }, {});
  expect(result.changed).toBe(false);
  expect(result.after).toEqual(committed);
});

test('computeEvidence writes mutation for journeys the report names and keeps the rest', () => {
  const report = {
    byJourney: new Map([
      ['tests/journeys/t.yaml#saves a ticket', { killed: 11, total: 12, unique: 2 }],
    ]),
    score: { killed: 11, total: 12 },
  };
  const named = compute(journey, { production: { segments, window }, mutation: report });
  expect(named.after.mutation).toEqual({ killed: 11, total: 12, unique: 2 });
  const other = compute(
    {
      ...journey,
      name: 'other',
      evidence: { mutation: { killed: 1, total: 3 }, refreshed: '2026-09-01' },
    },
    { mutation: report }
  );
  expect(other.after.mutation).toEqual({ killed: 1, total: 3 });
  expect(other.changed).toBe(false);
});
