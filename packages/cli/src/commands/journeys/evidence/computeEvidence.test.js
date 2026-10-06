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
import flowLines from './flowLines.js';
import sequenceId from './sequenceId.js';

const today = '2026-10-05';

function identity(verb, blockId) {
  return JSON.stringify([verb, blockId, null, null]);
}

function segment({
  session,
  page = 'tickets',
  steps,
  persons = [],
  orgs = [],
  failure,
  start = '2026-09-10T09:00:00.000Z',
}) {
  return {
    session,
    page_id: page,
    steps: steps.map((blockId) => ({ click: blockId })),
    sequence: steps.map((blockId) => ({ page, identity: identity('click', blockId) })),
    persons,
    orgs,
    failure,
    first_seen: start,
  };
}

const journey = {
  name: 'saves a ticket',
  pageId: 'tickets',
  steps: [{ click: 'edit' }, { click: 'save' }],
};

const live = {
  sequence: sequenceId(journey),
  pageId: 'tickets',
  flow: flowLines(journey),
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
  segment({
    session: 's6',
    steps: ['edit', 'save'],
    persons: ['p_5'],
    start: '2026-10-02T09:00:00.000Z',
  }),
];

const dayCounts = { '2026-09': 30, '2026-10': 3 };

function production(overrides = {}) {
  return { dayCounts, months: ['2026-09', '2026-10'], segments, ...overrides };
}

function month(name, days, sessions, persons = 0, orgs = 0, failures = 0) {
  return { month: name, days, sessions, persons, orgs, failures };
}

function compute(entry, sources = { production: production() }) {
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

test('computeEvidence counts backing sessions by the month they started, with distinct persons and orgs and failures', () => {
  const result = compute(journey);
  expect(result.after).toEqual({
    production: {
      ...live,
      months: [month('2026-09', 30, 3, 2, 2, 1), month('2026-10', 3, 1, 1, 0, 0)],
    },
    refreshed: today,
  });
  expect(result.changed).toBe(true);
});

test('computeEvidence writes a month read with no backing segment as zeros with its days', () => {
  const result = compute(journey, {
    production: production({ segments: segments.slice(0, 3) }),
  });
  expect(result.after.production.months).toEqual([
    month('2026-09', 30, 3, 2, 2, 1),
    month('2026-10', 3, 0),
  ]);
});

test('computeEvidence counts a segment that crosses a month boundary once, in the month it started', () => {
  const crossing = segment({
    session: 'x',
    steps: ['edit', 'save'],
    persons: ['p_9'],
    start: '2026-09-30T23:59:00.000Z',
  });
  const result = compute(journey, { production: production({ segments: [crossing] }) });
  expect(result.after.production.months).toEqual([
    month('2026-09', 30, 1, 1, 0, 0),
    month('2026-10', 3, 0),
  ]);
});

test('computeEvidence drops segments that started in a month not read', () => {
  const early = segment({ session: 'e', steps: ['edit', 'save'], start: '2026-08-31T23:00:00Z' });
  const result = compute(journey, {
    production: production({ months: ['2026-09'], segments: [early] }),
  });
  expect(result.after.production.months).toEqual([month('2026-09', 30, 0)]);
});

test('computeEvidence keeps a committed month the cache holds fewer final days of, and months it did not read', () => {
  const committed = {
    ...live,
    months: [month('2026-08', 31, 50, 5, 1, 0), month('2026-09', 30, 9, 3, 1, 0)],
  };
  const result = compute(
    { ...journey, evidence: { production: committed, refreshed: '2026-09-01' } },
    {
      production: production({ dayCounts: { '2026-09': 10, '2026-10': 3 } }),
    }
  );
  expect(result.after.production.months).toEqual([
    month('2026-08', 31, 50, 5, 1, 0),
    month('2026-09', 30, 9, 3, 1, 0),
    month('2026-10', 3, 1, 1, 0, 0),
  ]);
});

test('computeEvidence leaves a journey unchanged, refreshed included, when nothing moved', () => {
  const first = compute(journey);
  const second = compute(
    { ...journey, evidence: first.after },
    { production: production({ months: [], segments: [] }) }
  );
  expect(second.changed).toBe(false);
  expect(second.after).toEqual(first.after);
});

test('computeEvidence replaces the legacy window shape with monthly evidence', () => {
  const legacy = {
    sessions: 412,
    persons: 37,
    orgs: 9,
    share: 0.31,
    failures: 14,
    window: '2026-09-03/2026-10-02',
  };
  const result = compute({ ...journey, evidence: { production: legacy } });
  expect(result.after.production).toEqual({
    ...live,
    months: [month('2026-09', 30, 3, 2, 2, 1), month('2026-10', 3, 1, 1, 0, 0)],
  });
});

test('computeEvidence moves the months of an edited flow to deprecated, keeps counting it, and counts the new flow from empty', () => {
  const edited = { ...journey, steps: [{ click: 'edit' }, { click: 'title' }] };
  const committed = { ...live, months: [month('2026-08', 31, 7, 2, 1, 0)] };
  const result = compute({ ...edited, evidence: { production: committed } });
  expect(result.after.production).toEqual({
    sequence: sequenceId(edited),
    pageId: 'tickets',
    flow: flowLines(edited),
    months: [month('2026-09', 30, 1, 1, 1, 0), month('2026-10', 3, 0)],
    deprecated: [
      {
        ...live,
        replaced: today,
        months: [
          month('2026-08', 31, 7, 2, 1, 0),
          month('2026-09', 30, 3, 2, 2, 1),
          month('2026-10', 3, 1, 1, 0, 0),
        ],
      },
    ],
  });
});

test('computeEvidence makes a deprecated flow live again when the edit is undone', () => {
  const edited = { ...journey, steps: [{ click: 'edit' }, { click: 'title' }] };
  const first = compute({
    ...edited,
    evidence: { production: { ...live, months: [month('2026-08', 31, 7, 2, 1, 0)] } },
  });
  const reverted = compute(
    { ...journey, evidence: first.after },
    { production: production({ months: [], segments: [] }) }
  );
  expect(reverted.after.production).toEqual({
    ...live,
    months: first.after.production.deprecated[0].months,
    deprecated: [
      {
        sequence: sequenceId(edited),
        pageId: 'tickets',
        flow: flowLines(edited),
        replaced: today,
        months: first.after.production.months,
      },
    ],
  });
});

test('computeEvidence keeps a deprecated flow of an older matcher version without counting it', () => {
  const stale = {
    sequence: 'v0-00000000',
    pageId: 'tickets',
    flow: flowLines(journey),
    replaced: '2026-01-01',
    months: [month('2026-01', 31, 3)],
  };
  const result = compute({
    ...journey,
    evidence: { production: { ...live, months: [], deprecated: [stale] } },
  });
  expect(result.after.production.deprecated).toEqual([stale]);
});

test('computeEvidence rehashes a flow stored under an older matcher and recounts the months the cache holds', () => {
  const committed = {
    sequence: 'v0-00000000',
    pageId: 'tickets',
    flow: ['tickets old'],
    months: [month('2026-06', 30, 40), month('2026-09', 30, 99)],
  };
  const result = compute({ ...journey, evidence: { production: committed } });
  expect(result.after.production).toEqual({
    ...live,
    months: [
      month('2026-06', 30, 40),
      month('2026-09', 30, 3, 2, 2, 1),
      month('2026-10', 3, 1, 1, 0, 0),
    ],
  });
});

test('computeEvidence keeps committed explorer and mutation when their sources are absent, and removes dev', () => {
  const committed = {
    dev: { recordings: 2 },
    explorer: { prs: [2531] },
    mutation: { killed: 11, total: 12, unique: 2 },
    refreshed: '2026-09-01',
  };
  const result = compute({ ...journey, evidence: committed });
  expect(result.after).toEqual({
    production: expect.any(Object),
    explorer: { prs: [2531] },
    mutation: { killed: 11, total: 12, unique: 2 },
    refreshed: today,
  });
});

test('computeEvidence never adds mutation without a report', () => {
  expect(compute(journey).after).not.toHaveProperty('mutation');
});

test('computeEvidence keeps everything committed when no source is present', () => {
  const committed = {
    production: { ...live, months: [month('2026-09', 30, 3)] },
    refreshed: '2026-09-01',
  };
  const result = compute({ ...journey, evidence: committed }, {});
  expect(result.changed).toBe(false);
  expect(result.after).toEqual(committed);
});

test('computeEvidence removes a committed dev count even when nothing else changed', () => {
  const committed = {
    production: { ...live, months: [month('2026-09', 30, 3)] },
    dev: { recordings: 1 },
    refreshed: '2026-09-01',
  };
  const result = compute({ ...journey, evidence: committed }, {});
  expect(result.changed).toBe(true);
  expect(result.after).toEqual({
    production: committed.production,
    refreshed: today,
  });
});

test('computeEvidence writes mutation for journeys the report names and keeps the rest', () => {
  const report = {
    byJourney: new Map([
      ['tests/journeys/t.yaml#saves a ticket', { killed: 11, total: 12, unique: 2 }],
    ]),
    score: { killed: 11, total: 12 },
  };
  const named = compute(journey, { production: production(), mutation: report });
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

test("computeEvidence reads a journey with a list of users' mutation score from its first user's run", () => {
  const report = {
    byJourney: new Map([
      ['tests/journeys/t.yaml#saves a ticket [admin]', { killed: 9, total: 12, unique: 1 }],
      ['tests/journeys/t.yaml#saves a ticket [member]', { killed: 7, total: 12, unique: 0 }],
    ]),
    score: { killed: 9, total: 12 },
  };
  const result = compute(
    { ...journey, data: 'tickets', user: ['admin', 'member'] },
    { mutation: report }
  );
  expect(result.after.mutation).toEqual({ killed: 9, total: 12, unique: 1 });
});

test('computeEvidence counts the dev segments that back a journey for the summary and never writes them', () => {
  const devSegments = [
    segment({ session: 'd1', steps: ['edit', 'title', 'save'] }),
    segment({ session: 'd2', steps: ['save', 'edit'] }),
    segment({ session: 'd3', steps: ['edit', 'save'] }),
  ];
  const result = compute(
    { ...journey, evidence: { dev: { recordings: 7 }, refreshed: '2026-09-01' } },
    { production: production(), dev: { segments: devSegments } }
  );
  expect(result.devRecordings).toBe(2);
  expect(result.after).not.toHaveProperty('dev');
  expect(result.after.refreshed).toBe(today);
});

test('computeEvidence counts 0 dev recordings when dev recordings exist but none back the journey', () => {
  const result = compute(journey, {
    production: production(),
    dev: { segments: [segment({ session: 'd1', steps: ['close'] })] },
  });
  expect(result.devRecordings).toBe(0);
});

test('computeEvidence reads dev text by the config text rule on both sides', () => {
  const isConfigText = (text) => text === 'Assign';
  const devSegment = {
    session: 'd1',
    page_id: 'tickets',
    steps: [{ click: { blockId: 'grid', text: 'Sample customer' } }],
    sequence: [
      { page: 'tickets', identity: JSON.stringify(['click', 'grid', null, 'Sample customer']) },
    ],
    persons: [],
    orgs: [],
  };
  const entry = {
    name: 'opens a customer',
    pageId: 'tickets',
    steps: [{ click: { blockId: 'grid', text: 'Sample customer' } }],
  };
  const [result] = computeEvidence({
    journeys: [{ filePath: '/app/t.yaml', file: 't.yaml', journeyIndex: 0, journey: entry }],
    sources: { dev: { segments: [devSegment] } },
    today,
    isConfigText,
  });
  expect(result.devRecordings).toBe(1);
});

test('computeEvidence reads journey click text by the config text rule in the sequence id, flow and counts', () => {
  const isConfigText = (text) => text === 'Save';
  const guessed = {
    name: 'saves a ticket',
    pageId: 'tickets',
    steps: [{ click: 'edit' }, { click: { blockId: 'save', text: 'Sample value' } }],
  };
  const [result] = computeEvidence({
    journeys: [{ filePath: '/app/t.yaml', file: 't.yaml', journeyIndex: 0, journey: guessed }],
    sources: { production: production() },
    today,
    isConfigText,
  });
  expect(result.after.production.sequence).toBe(live.sequence);
  expect(result.after.production.flow).toEqual(live.flow);
  expect(result.after.production.months).toEqual(compute(journey).after.production.months);
  const labelled = {
    ...guessed,
    steps: [{ click: 'edit' }, { click: { blockId: 'save', text: 'Save' } }],
  };
  expect(sequenceId({ ...labelled, isConfigText })).not.toBe(live.sequence);
});
