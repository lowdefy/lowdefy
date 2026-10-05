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

import computeTiers from './computeTiers.js';
import flowLines from '../evidence/flowLines.js';
import inTier from './inTier.js';
import sequenceId from '../evidence/sequenceId.js';

// A journey with one click on its own block, refreshed, whose months give it
// `rate` sessions a day over 10 days of 2026-10.
function journey({ name, file = 'tests/journeys/a.yaml', rate, months, ...rest }) {
  const steps = [{ click: name.replace(/\W/g, '_') }];
  return {
    file,
    name,
    journey: {
      name,
      pageId: 'tickets',
      steps,
      evidence: {
        production: {
          sequence: sequenceId({ pageId: 'tickets', steps }),
          pageId: 'tickets',
          flow: flowLines({ pageId: 'tickets', steps }),
          months: months ?? [
            { month: '2026-10', days: 10, sessions: rate * 10, persons: 1, orgs: 1, failures: 0 },
          ],
        },
      },
      ...rest,
    },
  };
}

function tiersOf(result) {
  return Object.fromEntries(result.rows.map((row) => [row.name, row.tier]));
}

const five = [
  journey({ name: 'a', rate: 10 }),
  journey({ name: 'b', rate: 5 }),
  journey({ name: 'c', rate: 3 }),
  journey({ name: 'd', rate: 1 }),
  journey({ name: 'e', rate: 1 }),
];

test('computeTiers cuts rates 10, 5, 3, 1, 1 into common, wide and edge by cumulative share', () => {
  const result = computeTiers({ journeys: five });
  expect(tiersOf(result)).toEqual({ a: 'common', b: 'wide', c: 'wide', d: 'edge', e: 'edge' });
  expect(result.rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
  expect(result.matches).toBe(200);
  expect(result.refused).toBeUndefined();
  expect(result.windowMonths).toEqual(['2026-08', '2026-09', '2026-10']);
  expect(result.anchor).toBe('2026-10');
  const select = (tier) => result.rows.filter((row) => inTier({ row, tier })).map((r) => r.name);
  expect(select('common')).toEqual(['a']);
  expect(select('wide')).toEqual(['a', 'b', 'c']);
  expect(select('edge')).toEqual(['a', 'b', 'c', 'd', 'e']);
  expect(select('full')).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('computeTiers never splits journeys tied at a cut', () => {
  const result = computeTiers({
    journeys: [
      journey({ name: 'a', rate: 5 }),
      journey({ name: 'b', rate: 5 }),
      journey({ name: 'c', rate: 10 }),
    ],
  });
  expect(tiersOf(result)).toEqual({ c: 'common', a: 'wide', b: 'wide' });
  const tied = computeTiers({
    journeys: [journey({ name: 'a', rate: 10 }), journey({ name: 'b', rate: 10 })],
  });
  expect(tiersOf(tied)).toEqual({ a: 'common', b: 'common' });
});

test('computeTiers breaks rate ties by file, then name', () => {
  const result = computeTiers({
    journeys: [
      journey({ name: 'z', file: 'tests/journeys/b.yaml', rate: 20 }),
      journey({ name: 'y', file: 'tests/journeys/a.yaml', rate: 20 }),
      journey({ name: 'x', file: 'tests/journeys/a.yaml', rate: 20 }),
    ],
  });
  expect(result.rows.map((row) => row.name)).toEqual(['x', 'y', 'z']);
});

test('computeTiers puts a journey edited since the last refresh in every tier, outside the ranking', () => {
  const edited = journey({ name: 'edited', rate: 50 });
  edited.journey.steps = [{ click: 'something_else' }];
  const never = {
    file: 'tests/journeys/n.yaml',
    name: 'never',
    journey: { name: 'never', pageId: 'p', steps: [{ click: 'x' }] },
  };
  const result = computeTiers({ journeys: [...five, edited, never] });
  const rows = result.rows.filter((row) => row.unranked);
  expect(rows.map((row) => row.name)).toEqual(['edited', 'never']);
  expect(rows[0]).toMatchObject({ rank: null, rate: null, tier: 'common' });
  expect(result.matches).toBe(200);
  ['common', 'wide', 'edge', 'full'].forEach((tier) => {
    expect(rows.every((row) => inTier({ row, tier }))).toBe(true);
  });
});

test('computeTiers lists a deprecated journey in no tier, with its use', () => {
  const retired = journey({ name: 'retired', rate: 100, deprecated: true });
  const result = computeTiers({ journeys: [...five, retired] });
  const row = result.rows.find((entry) => entry.name === 'retired');
  expect(row).toMatchObject({ deprecated: true, tier: null, rank: null, rate: 100 });
  expect(tiersOf(result).a).toBe('common');
  ['common', 'wide', 'edge', 'full'].forEach((tier) => {
    expect(inTier({ row, tier })).toBe(false);
  });
});

test('computeTiers refuses tiers below 100 journey matches and prints the count', () => {
  const thin = [
    journey({ name: 'a', rate: 9 }),
    journey({
      name: 'b',
      months: [{ month: '2026-10', days: 9, sessions: 9, persons: 1, orgs: 1, failures: 0 }],
    }),
  ];
  const result = computeTiers({ journeys: thin });
  expect(result.matches).toBe(99);
  expect(result.refused).toContain('99 journey matches');
});

test('computeTiers says to pull and refresh when no journey has evidence', () => {
  const result = computeTiers({
    journeys: [
      { file: 'f', name: 'n', journey: { name: 'n', pageId: 'p', steps: [{ click: 'x' }] } },
    ],
  });
  expect(result.refused).toContain('lowdefy journeys evidence --refresh');
  expect(result.windowMonths).toEqual([]);
});

test('computeTiers ranks every journey over the calendar anchored on the newest month', () => {
  const old = journey({
    name: 'old',
    months: [
      { month: '2026-06', days: 30, sessions: 3000, persons: 1, orgs: 1, failures: 0 },
      { month: '2026-08', days: 31, sessions: 31, persons: 1, orgs: 1, failures: 2 },
    ],
  });
  const result = computeTiers({ journeys: [old, journey({ name: 'new', rate: 10 })] });
  expect(result.rows.find((row) => row.name === 'old')).toMatchObject({
    sessions: 31,
    failures: 2,
    days: 31,
    rate: 1,
  });
  expect(result.rows[0].name).toBe('new');
});

test('computeTiers reads --usage-window', () => {
  const old = journey({
    name: 'old',
    months: [{ month: '2026-06', days: 30, sessions: 300, persons: 1, orgs: 1, failures: 0 }],
  });
  const result = computeTiers({
    journeys: [old, journey({ name: 'new', rate: 10 })],
    usageWindow: '5m',
  });
  expect(result.windowMonths).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
  expect(result.rows.find((row) => row.name === 'old').rate).toBe(10);
});

// A journey clicking a grid cell by a data value: refresh stored its id with
// that text read as none, since it is not config text.
function valueJourney({ name, text }) {
  const isConfigText = (value) => value === 'Save';
  const refreshed = [{ click: { blockId: 'grid', column: 'name', text: 'Sample customer' } }];
  const entry = journey({ name, rate: 10 });
  return {
    ...entry,
    journey: {
      ...entry.journey,
      steps: [{ click: { blockId: 'grid', column: 'name', text } }],
      evidence: {
        production: {
          ...entry.journey.evidence.production,
          sequence: sequenceId({ pageId: 'tickets', steps: refreshed, isConfigText }),
          flow: flowLines({ pageId: 'tickets', steps: refreshed, isConfigText }),
        },
      },
    },
    isConfigText,
  };
}

test('computeTiers reads click text by the config text rule when it tells an edit from a data value', () => {
  const same = valueJourney({ name: 'same', text: 'Sample customer' });
  const otherValue = valueJourney({ name: 'other value', text: 'Another customer' });
  const label = valueJourney({ name: 'label', text: 'Save' });
  const result = computeTiers({
    journeys: [same, otherValue, label],
    isConfigText: same.isConfigText,
  });
  const unranked = Object.fromEntries(result.rows.map((row) => [row.name, row.unranked]));
  expect(unranked).toEqual({ same: false, 'other value': false, label: true });
});
