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
import parseCandidateOrigin from './parseCandidateOrigin.js';
import validateJourney from '../journeyGrammar/validateJourney.js';
import { blockMetas, blockTypes, traceJsonl } from './testTrace.js';

function compile({ existingCandidates } = {}) {
  return compileTrace({ blockMetas, blockTypes, existingCandidates, trace: traceJsonl });
}

function candidatesByName({ candidates }) {
  return Object.fromEntries(
    candidates.map((candidate) => [candidate.fileName, candidate.contents])
  );
}

test('compileTrace writes one candidate per distinct sequence, named page-hash.yaml', () => {
  const { candidates } = compile();
  expect(candidates.map((candidate) => candidate.fileName)).toEqual([
    'orders-5e9f5687.yaml',
    'orders-7ca042aa.yaml',
  ]);
  expect(candidates.every((candidate) => candidate.status === 'created')).toBe(true);
});

test('compileTrace compiles the happy-path session to the steps the mapping table names', () => {
  const [, candidate] = compile().candidates;
  expect(candidate.journey).toEqual({
    name: 'orders recorded 7ca042aa',
    pageId: 'orders',
    steps: [
      { expect: { state: { equals: true, path: 'loaded' } } },
      { set: { blockId: 'search', value: 'abc' } },
      { expect: { state: { equals: 'abc', path: 'search' } } },
      { set: { blockId: 'qty', value: 25 } },
      { expect: { state: { equals: 25, path: 'qty' } } },
      { press: { blockId: 'search', key: 'Enter' } },
      { press: { blockId: 'search', key: 'Escape' } },
      { click: 'submit' },
      { expect: { url: { contains: '/orders/o-1?tab=items' } } },
      { expect: { state: { equals: 'o-1', path: 'result.id' } } },
      { expect: { state: { equals: 42, path: 'result.total' } } },
      { expect: { state: { equals: false, path: 'result.open' } } },
      { expect: { state: { equals: 'ok', path: 'result.note' } } },
      { expect: { state: { equals: '2026-09-01T10:00:08.000Z', path: 'result.at' } } },
    ],
  });
});

test('compileTrace ends a failing journey at the failing step and records the failure origin', () => {
  const [candidate] = compile().candidates;
  expect(candidate.journey.steps[candidate.journey.steps.length - 1]).toEqual({ click: 'submit' });
  expect(candidate.origin.failure).toEqual({
    block_id: 'submit',
    config_key: 'pages.orders.blocks.2.events.onClick.0',
    error: 'RequestError',
    event_name: 'onClick',
    page_id: 'orders',
    rid: 'rid-b',
  });
});

test('compileTrace carries the cluster counts and both rankings on the candidate origin', () => {
  const [failing, happy] = compile().candidates;
  expect(failing.origin).toMatchObject({
    failures: 1,
    first_seen: '2026-09-01T11:00:00.000Z',
    last_seen: '2026-09-02T09:00:02.000Z',
    rank: { by_failures: 1, by_sessions: 1 },
    sample_rids: ['rid-b', 'rid-c'],
    sequence_hash: '5e9f5687',
    sessions: 2,
  });
  expect(happy.origin.failure).toBeUndefined();
});

test('compileTrace renders the origin and the skipped events as comments the file keeps', () => {
  const [, candidate] = compile().candidates;
  expect(candidate.contents).toContain('# origin:');
  expect(candidate.contents).toContain('#   sequence_hash: 7ca042aa');
  expect(candidate.contents).toContain(
    '# onWidgetReady on "widget" is not a step: no interaction reaches it.'
  );
  expect(parseCandidateOrigin({ contents: candidate.contents })).toEqual(candidate.origin);
});

test('compileTrace renders a candidate that parses and validates as a journey', () => {
  compile().candidates.forEach((candidate) => {
    expect(validateJourney({ journey: YAML.parse(candidate.contents) })).toEqual({ valid: true });
  });
});

test('compileTrace rerun over a known sequence hash updates the file instead of writing a new one', () => {
  const first = compile();
  const second = compile({ existingCandidates: candidatesByName(first) });
  expect(second.candidates.map((candidate) => candidate.status)).toEqual(['updated', 'updated']);
  expect(candidatesByName(second)).toEqual(candidatesByName(first));
});

test('compileTrace keeps edits to a known candidate and rewrites only its origin block', () => {
  const [candidate] = compile().candidates;
  const edited = candidate.contents.replace(
    'name: orders recorded 5e9f5687',
    'name: order submit fails\nfixtures:\n  - orders'
  );
  const { candidates } = compile({ existingCandidates: { [candidate.fileName]: edited } });
  const updated = candidates.find((entry) => entry.fileName === candidate.fileName);
  expect(YAML.parse(updated.contents)).toMatchObject({
    fixtures: ['orders'],
    name: 'order submit fails',
  });
  expect(parseCandidateOrigin({ contents: updated.contents }).sequence_hash).toBe('5e9f5687');
});

test('compileTrace widens the origin window with what the candidate already recorded', () => {
  const [candidate] = compile().candidates;
  const earlier = candidate.contents.replace(
    '#   first_seen: 2026-09-01T11:00:00.000Z',
    '#   first_seen: 2026-08-01T00:00:00.000Z'
  );
  const { candidates } = compile({ existingCandidates: { [candidate.fileName]: earlier } });
  const updated = candidates.find((entry) => entry.fileName === candidate.fileName);
  expect(updated.origin.first_seen).toBe('2026-08-01T00:00:00.000Z');
  expect(updated.origin.last_seen).toBe('2026-09-02T09:00:02.000Z');
});

test('compileTrace ranks the triples the trace saw by the sessions that drove them', () => {
  expect(compile().triples).toEqual([
    { block_id: 'search', event_name: 'onChange', page_id: 'orders', sessions: 3 },
    { block_id: 'submit', event_name: 'onClick', page_id: 'orders', sessions: 3 },
    { block_id: 'qty', event_name: 'onChange', page_id: 'orders', sessions: 1 },
    { block_id: 'search', event_name: 'onEnter', page_id: 'orders', sessions: 1 },
    { block_id: 'search', event_name: 'onKeyDown', page_id: 'orders', sessions: 1 },
    { block_id: 'widget', event_name: 'onWidgetReady', page_id: 'orders', sessions: 1 },
  ]);
});
