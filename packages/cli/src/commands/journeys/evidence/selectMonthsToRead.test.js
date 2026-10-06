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

import flowLines from './flowLines.js';
import selectMonthsToRead from './selectMonthsToRead.js';
import sequenceId from './sequenceId.js';

const today = '2026-10-05';
const steps = [{ click: 'edit' }, { click: 'save' }];
const live = {
  sequence: sequenceId({ pageId: 'tickets', steps }),
  pageId: 'tickets',
  flow: flowLines({ pageId: 'tickets', steps }),
};

function month(name, days) {
  return { month: name, days, sessions: 1, persons: 1, orgs: 1, failures: 0 };
}

function journey(production) {
  return { name: 'saves', pageId: 'tickets', steps, evidence: { production } };
}

const dayCounts = { '2026-08': 31, '2026-09': 30, '2026-10': 3 };

test('selectMonthsToRead reads every cached month for a journey with no evidence', () => {
  expect(
    selectMonthsToRead({ journeys: [{ pageId: 'tickets', steps }], dayCounts, today })
  ).toEqual(['2026-08', '2026-09', '2026-10']);
});

test('selectMonthsToRead reads only months where the cache holds more final days', () => {
  const production = {
    ...live,
    months: [month('2026-08', 31), month('2026-09', 30), month('2026-10', 2)],
  };
  expect(selectMonthsToRead({ journeys: [journey(production)], dayCounts, today })).toEqual([
    '2026-10',
  ]);
});

test('selectMonthsToRead reads nothing when every entry holds as many final days', () => {
  const production = {
    ...live,
    months: [month('2026-08', 31), month('2026-09', 30), month('2026-10', 3)],
  };
  expect(selectMonthsToRead({ journeys: [journey(production)], dayCounts, today })).toEqual([]);
});

test('selectMonthsToRead reads the months a deprecated flow is missing', () => {
  const production = {
    ...live,
    months: [month('2026-08', 31), month('2026-09', 30), month('2026-10', 3)],
    deprecated: [
      {
        sequence: 'v1-00000000',
        pageId: 'tickets',
        flow: [],
        replaced: '2026-09-15',
        months: [month('2026-09', 30)],
      },
      {
        sequence: 'v0-00000000',
        pageId: 'tickets',
        flow: [],
        replaced: '2026-01-15',
        months: [],
      },
    ],
  };
  expect(selectMonthsToRead({ journeys: [journey(production)], dayCounts, today })).toEqual([
    '2026-08',
    '2026-10',
  ]);
});

test('selectMonthsToRead reads every cached month for a flow stored under an older matcher', () => {
  const production = {
    ...live,
    sequence: 'v0-00000000',
    months: [month('2026-08', 31), month('2026-09', 30), month('2026-10', 3)],
  };
  expect(selectMonthsToRead({ journeys: [journey(production)], dayCounts, today })).toEqual([
    '2026-08',
    '2026-09',
    '2026-10',
  ]);
});
