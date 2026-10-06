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

import formatEvidence from './formatEvidence.js';

const production = {
  sessions: 412,
  persons: 37,
  orgs: 9,
  share: 0.31,
  failures: 14,
  window: '2026-09-03/2026-10-02',
};

test('formatEvidence shows sessions, orgs and mutants', () => {
  expect(
    formatEvidence({ evidence: { production, mutation: { killed: 11, total: 12, unique: 2 } } })
  ).toBe('412 sessions · 9 orgs · 11/12 mutants');
});

test('formatEvidence leaves orgs out when the app sends none', () => {
  expect(
    formatEvidence({
      evidence: { production: { ...production, orgs: 0 }, mutation: { killed: 1, total: 2 } },
    })
  ).toBe('412 sessions · 1/2 mutants');
});

test('formatEvidence leaves mutants out without a mutation report', () => {
  expect(formatEvidence({ evidence: { production } })).toBe('412 sessions · 9 orgs');
});

test('formatEvidence says 0 sessions in window for an unbacked journey', () => {
  expect(
    formatEvidence({
      evidence: {
        production: { ...production, sessions: 0, persons: 0, orgs: 0 },
        mutation: { killed: 4, total: 5 },
      },
    })
  ).toBe('0 sessions in window · 4/5 mutants');
});

test('formatEvidence shows mutants alone when there is no production evidence', () => {
  expect(formatEvidence({ evidence: { mutation: { killed: 4, total: 5 } } })).toBe('4/5 mutants');
});

test('formatEvidence is empty with nothing to show', () => {
  expect(formatEvidence({ evidence: undefined })).toBe('');
  expect(formatEvidence({ evidence: { dev: { recordings: 2 }, refreshed: '2026-10-03' } })).toBe(
    ''
  );
});

test('formatEvidence shows the all-time sessions of monthly evidence and leaves orgs out', () => {
  const monthly = {
    sequence: 'v1-3f9a12c0',
    pageId: 'tickets',
    flow: [],
    months: [
      { month: '2026-09', days: 30, sessions: 412, persons: 37, orgs: 9, failures: 14 },
      { month: '2026-10', days: 3, sessions: 38, persons: 11, orgs: 5, failures: 1 },
    ],
  };
  expect(
    formatEvidence({ evidence: { production: monthly, mutation: { killed: 11, total: 12 } } })
  ).toBe('450 sessions · 11/12 mutants');
});

test('formatEvidence shows 0 sessions for monthly evidence with no backing', () => {
  const monthly = {
    sequence: 'v1-3f9a12c0',
    pageId: 'tickets',
    flow: [],
    months: [{ month: '2026-10', days: 3, sessions: 0, persons: 0, orgs: 0, failures: 0 }],
  };
  expect(formatEvidence({ evidence: { production: monthly } })).toBe('0 sessions');
});

const usage = {
  tier: 'common',
  rank: 2,
  rate: 13.666,
  failures: 14,
  unranked: false,
  usageWindow: '3m',
};

test('formatEvidence shows the tier, rank, rate and failures over the window in place of sessions', () => {
  const monthly = {
    sequence: 'v1-3f9a12c0',
    pageId: 'tickets',
    flow: [],
    months: [{ month: '2026-09', days: 30, sessions: 410, persons: 37, orgs: 9, failures: 14 }],
  };
  expect(
    formatEvidence({
      evidence: { production: monthly, mutation: { killed: 11, total: 12 } },
      usage,
    })
  ).toBe('common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants');
  expect(formatEvidence({ evidence: { production: monthly }, usage })).toBe(
    'common #2 · 13.7/day · 14 failed (3m)'
  );
});

test('formatEvidence shows unranked for a journey with no counts for its current flow', () => {
  expect(
    formatEvidence({
      evidence: { production, mutation: { killed: 4, total: 5 } },
      usage: { tier: 'common', rank: null, rate: null, failures: null, unranked: true },
    })
  ).toBe('unranked · 4/5 mutants');
});
