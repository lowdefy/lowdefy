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

import mergeMutationReport from './mergeMutationReport.js';

function verdict(name, value) {
  return { file: `${name}.yaml`, name, verdict: value, failure: null, misses: [] };
}

function journey(name, killed, total, unique = 0) {
  return { file: `${name}.yaml`, name, killed, total, unique };
}

const previous = {
  version: 1,
  generated: '2026-10-01T00:00:00.000Z',
  buildId: 'old',
  killed: 1,
  total: 2,
  mutants: [
    { id: 'shared', status: 'killed', ranBy: [verdict('a', 'killed'), verdict('b', 'survived')] },
    { id: 'onlyB', status: 'survived', ranBy: [verdict('b', 'survived')] },
    { id: 'gone', status: 'killed', ranBy: [verdict('c', 'killed')] },
  ],
  journeys: [journey('a', 1, 1), journey('b', 0, 2), journey('c', 1, 1)],
};

const report = {
  version: 1,
  generated: '2026-10-06T00:00:00.000Z',
  buildId: 'new',
  killed: 0,
  total: 1,
  mutants: [{ id: 'shared', status: 'survived', ranBy: [verdict('b', 'survived')] }],
  journeys: [journey('b', 0, 1)],
};

test('mergeMutationReport replaces this run journeys, keeps the others that still exist and recounts', () => {
  const merged = mergeMutationReport({
    previous,
    report,
    journeyKeys: new Set(['a.yaml#a', 'b.yaml#b']),
    currentIds: new Set(['shared', 'onlyB', 'gone']),
  });
  expect(merged.generated).toBe(report.generated);
  expect(merged.buildId).toBe('new');
  expect(merged.journeys).toEqual([journey('a', 1, 1, 1), journey('b', 0, 1)]);
  expect(merged.mutants).toEqual([
    {
      id: 'shared',
      status: 'killed',
      ranBy: [verdict('a', 'killed'), verdict('b', 'survived')],
    },
  ]);
  expect(merged.killed).toBe(1);
  expect(merged.total).toBe(1);
});

test('mergeMutationReport keeps a changed mutant changed', () => {
  const merged = mergeMutationReport({
    previous,
    report: { ...report, mutants: [{ id: 'shared', status: 'changed', ranBy: [] }] },
    journeyKeys: new Set(['a.yaml#a', 'b.yaml#b']),
    currentIds: new Set(['shared', 'onlyB', 'gone']),
  });
  expect(merged.mutants[0].status).toBe('changed');
  expect(merged.killed).toBe(0);
});

test('mergeMutationReport recounts unique over the merged verdicts when two runs kill the same mutant', () => {
  const merged = mergeMutationReport({
    previous: {
      ...previous,
      mutants: [{ id: 'shared', status: 'killed', ranBy: [verdict('a', 'killed')] }],
      journeys: [journey('a', 1, 1, 1)],
    },
    report: {
      ...report,
      killed: 1,
      mutants: [
        { id: 'shared', status: 'killed', ranBy: [verdict('b', 'killed')] },
        { id: 'onlyB', status: 'killed', ranBy: [verdict('b', 'killed')] },
      ],
      journeys: [journey('b', 2, 2, 2)],
    },
    journeyKeys: new Set(['a.yaml#a', 'b.yaml#b']),
    currentIds: new Set(['shared', 'onlyB', 'gone']),
  });
  expect(merged.journeys).toEqual([journey('a', 1, 1, 0), journey('b', 2, 2, 1)]);
});

const earlierOnlyA = {
  ...previous,
  mutants: [
    ...previous.mutants,
    { id: 'removed', status: 'killed', ranBy: [verdict('a', 'killed')] },
    { id: 'standing', status: 'survived', ranBy: [verdict('a', 'survived')] },
  ],
};

test('mergeMutationReport keeps an earlier mutant this run did not list only while it still exists', () => {
  const merged = mergeMutationReport({
    previous: earlierOnlyA,
    report,
    journeyKeys: new Set(['a.yaml#a', 'b.yaml#b']),
    currentIds: new Set(['standing']),
  });
  expect(merged.mutants.map(({ id }) => id)).toEqual(['shared', 'standing']);
  // The removed mutant's kill no longer counts for the suite or for journey a.
  expect(merged.killed).toBe(1);
  expect(merged.total).toBe(2);
  expect(merged.journeys).toEqual([journey('a', 1, 2, 1), journey('b', 0, 1)]);
});
