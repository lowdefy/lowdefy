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

import YAML from 'yaml';

import compileTrace from './compileTrace.js';
import journeySequence from './journeySequence.js';
import traceRecord from './traceRecord.js';
import validateJourneySteps from '../journeyGrammar/validateJourneySteps.js';
import { blockMetas, traceRecords } from './testTrace.js';

// The shared corpus as explorer walks, the only source compiled to candidates.
const walkRecords = traceRecords.map((record) => ({ ...record, source: 'explorer' }));

function compile({ records = walkRecords, filters } = {}) {
  return compileTrace({ records, blockMetas, source: 'explorer', filters });
}

function candidatesByName({ candidates }) {
  return Object.fromEntries(
    candidates.map((candidate) => [candidate.fileName, candidate.contents])
  );
}

test('compileTrace writes one candidate per distinct sequence, named page-hash.yaml', () => {
  const { candidates } = compile();
  expect(candidates.map((candidate) => candidate.fileName)).toEqual([
    'orders-ae8a08a2.yaml',
    'orders-5e5c5766.yaml',
  ]);
});

test('compileTrace compiles the happy-path walk to v7 steps', () => {
  const [, candidate] = compile().candidates;
  expect(candidate.journey).toEqual({
    name: 'orders recorded 5e5c5766',
    pageId: 'orders',
    user: { roles: ['sales'] },
    steps: [
      { fill: { blockId: 'search', value: 'abc', from: 'recorded' } },
      { expect: { state: { path: 'search', equals: 'abc', from: 'recorded' } } },
      { fill: { blockId: 'qty', value: 25, from: 'recorded' } },
      { expect: { state: { path: 'qty', equals: 25, from: 'recorded' } } },
      { press: 'Enter' },
      { wait: { request: 'search_orders' } },
      { press: 'Escape' },
      { click: 'submit' },
      { wait: { request: 'save_order' } },
      { expect: { state: { path: 'result.id', equals: 'o-1', from: 'recorded' } } },
      { expect: { state: { path: 'result.total', equals: 42, from: 'recorded' } } },
      { expect: { state: { path: 'result.open', equals: false, from: 'recorded' } } },
      { expect: { state: { path: 'result.note', equals: 'ok', from: 'recorded' } } },
      {
        expect: {
          state: { path: 'result.at', equals: '2026-09-01T10:00:08.000Z', from: 'recorded' },
        },
      },
      { expect: { url: { contains: '/orders/o-1?tab=items' } } },
    ],
  });
});

test('compileTrace ends a failing journey at the failing step with a failed-here comment', () => {
  const [candidate] = compile().candidates;
  expect(candidate.journey.steps[candidate.journey.steps.length - 1]).toEqual({ click: 'submit' });
  expect(candidate.contents).toContain(
    '# failed here: RequestError in Request (pages.orders.blocks.2.events.onClick.0)\n  - click: submit'
  );
  expect(candidate.origin.failure).toBe('orders.submit.onClick');
});

test('compileTrace carries cluster counts, both ranks, persons and orgs on the origin', () => {
  const [failing, happy] = compile().candidates;
  expect(failing.origin).toEqual({
    source: 'explorer',
    sequence_hash: 'ae8a08a2',
    sessions: 2,
    persons: 0,
    orgs: 0,
    failures: 1,
    failure: 'orders.submit.onClick',
    first_seen: '2026-09-01T11:00:00.000Z',
    last_seen: '2026-09-02T09:00:02.000Z',
    rank: { by_sessions: 1, by_failures: 1 },
    sample_sessions: ['s-b', 's-c'],
  });
  expect(happy.origin.failure).toBeUndefined();
  expect(happy.origin.rank).toEqual({ by_sessions: 2, by_failures: 2 });
});

test('compileTrace renders the origin and programmatic events as comments the file keeps', () => {
  const [, candidate] = compile().candidates;
  expect(candidate.contents).toContain('# origin:');
  expect(candidate.contents).toContain('#   sequence_hash: 5e5c5766');
  expect(candidate.contents).toContain(
    '# onWidgetReady on "widget" ran with no interaction causing it; not a step.'
  );
});

test('compileTrace renders candidates that parse and validate as journeys', () => {
  compile().candidates.forEach((candidate) => {
    const journey = YAML.parse(candidate.contents);
    expect(Object.keys(journey)).toEqual(['name', 'pageId', 'user', 'steps']);
    expect(validateJourneySteps({ steps: journey.steps })).toEqual({});
  });
});

test('compileTrace gives a rendered candidate the sequence of the segment it was compiled from', () => {
  const { candidates, segments } = compile();
  candidates.forEach((candidate) => {
    const journey = YAML.parse(candidate.contents);
    const segment = segments.find((entry) => entry.hash === candidate.hash);
    expect(journeySequence({ pageId: journey.pageId, steps: journey.steps })).toEqual(
      segment.sequence
    );
  });
});

function shortFlow({ session, at, value, failing = false }) {
  return [
    traceRecord({ at, session, kind: 'pageview', url: '/tickets', source: 'explorer' }),
    traceRecord({
      at: at + 1,
      session,
      kind: 'change',
      block: 'title',
      source: 'explorer',
      value,
    }),
    traceRecord({
      at: at + 2,
      session,
      block: 'save',
      source: 'explorer',
      ...(failing
        ? { event: { name: 'onClick', block_id: 'save', success: false, error: { name: 'Error' } } }
        : {}),
    }),
  ];
}

test('compileTrace takes the latest segment as representative when none fails', () => {
  const { candidates } = compile({
    records: [
      ...shortFlow({ session: 's-1', at: 0, value: 'first' }),
      ...shortFlow({ session: 's-2', at: 100, value: 'latest' }),
    ],
  });
  expect(candidates).toHaveLength(1);
  expect(candidates[0].journey.steps[0]).toEqual({
    fill: { blockId: 'title', value: 'latest', from: 'recorded' },
  });
});

test('compileTrace takes a failing segment as representative over a later passing one', () => {
  const { candidates } = compile({
    records: [
      ...shortFlow({ session: 's-1', at: 0, value: 'failed', failing: true }),
      ...shortFlow({ session: 's-2', at: 100, value: 'passed' }),
    ],
  });
  expect(candidates).toHaveLength(1);
  expect(candidates[0].journey.steps[0].fill.value).toBe('failed');
  expect(candidates[0].origin.failures).toBe(1);
});

test('compileTrace keeps only walks inside the until filter', () => {
  const { candidates } = compile({
    records: [
      ...shortFlow({ session: 's-1', at: 0, value: 'kept' }),
      ...shortFlow({ session: 's-2', at: 1000, value: 'late' }),
    ],
    filters: { until: '2026-09-28T14:10:00.000Z' },
  });
  expect(candidates.map((candidate) => candidate.origin.sample_sessions)).toEqual([['s-1']]);
});

test('compileTrace gives byte-identical contents when the same records are compiled twice', () => {
  expect(candidatesByName(compile())).toEqual(candidatesByName(compile()));
});

test('compileTrace compiles only explorer walks', () => {
  expect(() => compileTrace({ records: traceRecords, source: 'dev' })).toThrow(
    'Journey compiler compiles only explorer walks to candidates. Received "source" "dev".'
  );
});

test('compileTrace prepareCandidate can drop a candidate, drop steps and add to the origin', () => {
  const seen = [];
  const { candidates } = compileTrace({
    records: walkRecords,
    blockMetas,
    source: 'explorer',
    prepareCandidate: ({ journey, origin, comments, sessions }) => {
      seen.push(sessions);
      if (journey.steps.some((step) => step.click === 'submit') && origin.failures > 0) return null;
      return {
        journey: { ...journey, steps: journey.steps.filter((step) => !step.expect?.state) },
        comments,
        origin: {
          ...origin,
          explorer: { run: '20261004T120000Z-ab12cd', pr: null, walks: ['walk-1'] },
        },
      };
    },
  });
  expect(seen.every((sessions) => Array.isArray(sessions) && sessions.length > 0)).toBe(true);
  expect(candidates.map((candidate) => candidate.fileName)).toEqual(['orders-5e5c5766.yaml']);
  const [candidate] = candidates;
  expect(candidate.journey.steps.some((step) => step.expect?.state)).toBe(false);
  expect(candidate.contents).toContain('#   explorer:\n#     run: 20261004T120000Z-ab12cd');
  expect(
    validateJourneySteps({ steps: YAML.parse(candidate.contents).steps }).error
  ).toBeUndefined();
});
