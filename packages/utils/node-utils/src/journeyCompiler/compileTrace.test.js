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
import parseCandidateOrigin from './parseCandidateOrigin.js';
import traceRecord from './traceRecord.js';
import validateJourneySteps from '../journeyGrammar/validateJourneySteps.js';
import { blockMetas, traceRecords } from './testTrace.js';

function compile({ existingCandidates, records = traceRecords, source = 'dev', filters } = {}) {
  return compileTrace({ records, blockMetas, existingCandidates, source, filters });
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
  expect(candidates.every((candidate) => candidate.status === 'created')).toBe(true);
});

test('compileTrace compiles the happy-path session to v7 steps', () => {
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

test('compileTrace carries cluster counts, both ranks, persons, orgs and source on the origin', () => {
  const [failing, happy] = compile().candidates;
  expect(failing.origin).toEqual({
    source: 'dev',
    sequence_hash: 'ae8a08a2',
    sessions: 2,
    persons: 0,
    orgs: 0,
    failures: 1,
    failure: 'orders.submit.onClick',
    first_seen: '2026-09-01T11:00:00.000Z',
    last_seen: '2026-09-02T09:00:02.000Z',
    rank: { by_sessions: 1, by_failures: 1 },
    builds: ['2026-09-01T09:00:00.000Z'],
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
  expect(parseCandidateOrigin({ contents: candidate.contents })).toEqual(candidate.origin);
});

test('compileTrace renders candidates that parse and validate as journeys', () => {
  compile().candidates.forEach((candidate) => {
    const journey = YAML.parse(candidate.contents);
    expect(Object.keys(journey)).toEqual(['name', 'pageId', 'user', 'steps']);
    expect(validateJourneySteps({ steps: journey.steps })).toEqual({});
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
  const edited = candidate.contents
    .replace('name: orders recorded ae8a08a2', 'name: order submit fails\ntimeout: 20000')
    .replace('      value: x\n      from: recorded\n', '      value: shoes\n');
  const { candidates } = compile({ existingCandidates: { [candidate.fileName]: edited } });
  const updated = candidates.find((entry) => entry.fileName === candidate.fileName);
  expect(YAML.parse(updated.contents)).toMatchObject({
    name: 'order submit fails',
    timeout: 20000,
    steps: [{ fill: { blockId: 'search', value: 'shoes' } }, expect.anything(), expect.anything()],
  });
  expect(parseCandidateOrigin({ contents: updated.contents }).sequence_hash).toBe('ae8a08a2');
});

function countOriginBlocks({ contents }) {
  return contents.split('\n').filter((line) => line === '# origin:').length;
}

test('compileTrace rerun keeps one origin block when a developer comment sits above name', () => {
  const [candidate] = compile().candidates;
  const edited = candidate.contents.replace(
    '\nname: orders recorded ae8a08a2',
    '\n# Submit fails when the search box is empty.\nname: orders recorded ae8a08a2'
  );
  const once = compile({ existingCandidates: { [candidate.fileName]: edited } });
  const twice = compile({ existingCandidates: candidatesByName(once) });
  const updated = twice.candidates.find((entry) => entry.fileName === candidate.fileName);
  expect(countOriginBlocks({ contents: updated.contents })).toBe(1);
  expect(updated.contents).toContain(
    '\n# Submit fails when the search box is empty.\nname: orders recorded ae8a08a2'
  );
  expect(parseCandidateOrigin({ contents: updated.contents })).toEqual(updated.origin);
});

test('compileTrace rerun keeps one origin block when the blank line after it is removed', () => {
  const [candidate] = compile().candidates;
  const edited = candidate.contents.replace(
    '\n\nname: orders recorded ae8a08a2',
    '\nname: orders recorded ae8a08a2'
  );
  const once = compile({ existingCandidates: { [candidate.fileName]: edited } });
  const twice = compile({ existingCandidates: candidatesByName(once) });
  const updated = twice.candidates.find((entry) => entry.fileName === candidate.fileName);
  expect(countOriginBlocks({ contents: updated.contents })).toBe(1);
  expect(updated.contents).toEqual(candidate.contents);
});

test('compileTrace widens the origin window and merges sample sessions with what the candidate recorded', () => {
  const [candidate] = compile().candidates;
  const earlier = candidate.contents
    .replace('#   first_seen: 2026-09-01T11:00:00.000Z', '#   first_seen: 2026-08-01T00:00:00.000Z')
    .replace('#     - s-c', '#     - s-c\n#     - s-old');
  const { candidates } = compile({ existingCandidates: { [candidate.fileName]: earlier } });
  const updated = candidates.find((entry) => entry.fileName === candidate.fileName);
  expect(updated.origin.first_seen).toBe('2026-08-01T00:00:00.000Z');
  expect(updated.origin.last_seen).toBe('2026-09-02T09:00:02.000Z');
  expect(updated.origin.sample_sessions).toEqual(['s-b', 's-c', 's-old']);
  expect(updated.origin.sessions).toBe(2);
});

test('compileTrace returns every segment with its hash, sequence, steps and people', () => {
  const { segments } = compile();
  expect(segments.map((segment) => [segment.session, segment.hash, segment.failure])).toEqual([
    ['s-a', '5e5c5766', undefined],
    ['s-b', 'ae8a08a2', 'orders.submit.onClick'],
    ['s-c', 'ae8a08a2', undefined],
  ]);
  expect(segments[1]).toMatchObject({
    persons: [],
    orgs: [],
    roles: ['sales'],
    first_seen: '2026-09-01T11:00:00.000Z',
    last_seen: '2026-09-01T11:00:02.000Z',
    sequence: [
      { page: 'orders', identity: '["fill","search",null,null]' },
      { page: 'orders', identity: '["click","submit",null,null]' },
    ],
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

function shortFlow({ session, at, value, failing = false, source = 'dev', ...rest }) {
  return [
    traceRecord({ at, session, kind: 'pageview', url: '/tickets', source, ...rest }),
    traceRecord({
      at: at + 1,
      session,
      kind: 'change',
      block: 'title',
      source,
      ...(source === 'production' ? {} : { value }),
      ...rest,
    }),
    traceRecord({
      at: at + 2,
      session,
      block: 'save',
      source,
      ...(failing
        ? { event: { name: 'onClick', block_id: 'save', success: false, error: { name: 'Error' } } }
        : {}),
      ...rest,
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

test('compileTrace leaves out segments with no interaction steps', () => {
  const { candidates, segments } = compile({
    records: [
      traceRecord({ at: 0, kind: 'pageview', url: '/tickets' }),
      traceRecord({
        at: 1,
        kind: 'engine',
        event: { name: 'onMount', block_id: 'tickets', success: true },
      }),
    ],
  });
  expect(candidates).toEqual([]);
  expect(segments).toEqual([]);
});

test('compileTrace leaves out records of other sources', () => {
  const { segments } = compile({
    records: [
      ...shortFlow({ session: 's-1', at: 0, value: 'a' }),
      ...shortFlow({ session: 's-2', at: 100, source: 'explorer', value: 'b' }),
    ],
  });
  expect(segments.map((segment) => segment.session)).toEqual(['s-1']);
});

test('compileTrace keeps only records inside the since and until window', () => {
  const records = [
    ...shortFlow({ session: 's-1', at: 0, value: 'a' }),
    ...shortFlow({ session: 's-2', at: 1000, value: 'b' }),
    ...shortFlow({ session: 's-3', at: 2000, value: 'c' }),
  ];
  const { segments } = compile({
    records,
    filters: { since: '2026-09-28T14:10:00.000Z', until: '2026-09-28T14:20:00.000Z' },
  });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
});

test('compileTrace keeps only segments whose records all ran on the build filter', () => {
  const records = [
    ...shortFlow({ session: 's-1', at: 0, value: 'a', build: 'b1' }),
    ...shortFlow({ session: 's-2', at: 100, value: 'b', build: 'b2' }),
    ...shortFlow({ session: 's-3', at: 200, value: 'c', build: 'b2' }).map((record, index) =>
      index === 2 ? { ...record, build: 'b3' } : record
    ),
  ];
  const { segments } = compile({ records, filters: { build: 'b2' } });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
});

test('compileTrace keeps only segments that visit the page filter', () => {
  const records = [
    ...shortFlow({ session: 's-1', at: 0, value: 'a' }),
    ...shortFlow({ session: 's-2', at: 100, value: 'b', page: 'orders' }),
  ];
  const { segments } = compile({ records, filters: { page: 'orders' } });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
});

const ASSIGN = 't_00000000000000a1';
const DELETE = 't_00000000000000d1';

// A production visit to tickets, then the given clicks. Each click is
// { block, text, token, row, column, option }: text is config text a reader
// resolved, a token alone resolved to nothing.
function productionVisit({ session, at = 0, clicks }) {
  return [
    traceRecord({
      at,
      session,
      kind: 'pageview',
      url: '/tickets',
      source: 'production',
      person: `p-${session}`,
    }),
    ...clicks.map((click, index) =>
      traceRecord({
        at: at + index + 1,
        session,
        source: 'production',
        person: `p-${session}`,
        ...click,
      })
    ),
  ];
}

test('compileTrace compiles config text as text and a data-row token without text', () => {
  const { candidates } = compile({
    records: productionVisit({
      session: 's1',
      clicks: [
        { block: 'assign_button', text: 'Assign', token: ASSIGN },
        { block: 'grid', row: 2, column: 'name', token: 't_0000000000a0c0e1' },
      ],
    }),
    source: 'production',
  });
  expect(candidates).toHaveLength(1);
  const [candidate] = candidates;
  expect(candidate.journey.steps).toEqual([
    { click: { blockId: 'assign_button', text: 'Assign' } },
    { click: { blockId: 'grid', row: 2, column: 'name' } },
  ]);
  expect(candidate.origin.flags).toEqual(['tokenised-text']);
  expect(candidate.contents).toContain(
    '# clicked text not in config: t_0000000000a0c0e1\n  - click:\n      blockId: grid'
  );
  expect(candidate.origin.text_tokens).toEqual([
    {
      page: 'tickets',
      block_id: 'grid',
      column: 'name',
      clicks: 1,
      tokens: 1,
      top: [{ token: 't_0000000000a0c0e1', clicks: 1, persons: 1 }],
    },
  ]);
  expect(parseCandidateOrigin({ contents: candidate.contents }).text_tokens).toEqual(
    candidate.origin.text_tokens
  );
});

test('compileTrace keeps two config labels in one block apart', () => {
  const { candidates, segments } = compile({
    records: [
      ...productionVisit({
        session: 's1',
        clicks: [{ block: 'grid', row: 0, text: 'Assign', token: ASSIGN }],
      }),
      ...productionVisit({
        session: 's2',
        at: 100,
        clicks: [{ block: 'grid', row: 0, text: 'Delete', token: DELETE }],
      }),
    ],
    source: 'production',
  });
  expect(segments[0].hash).not.toBe(segments[1].hash);
  expect(candidates.map((candidate) => candidate.journey.steps)).toEqual(
    expect.arrayContaining([
      [{ click: { blockId: 'grid', row: 0, text: 'Assign' } }],
      [{ click: { blockId: 'grid', row: 0, text: 'Delete' } }],
    ])
  );
});

test('compileTrace picks a config option label and leaves a tokenised option as a placeholder', () => {
  const { candidates } = compile({
    records: productionVisit({
      session: 's1',
      clicks: [
        { block: 'status', option: true, text: 'Open', token: 't_000000000000e000' },
        { block: 'customer', option: true, token: 't_0000000000a0c0e1' },
      ],
    }),
    source: 'production',
  });
  const [candidate] = candidates;
  expect(candidate.journey.steps).toEqual([
    { select: { blockId: 'status', value: 'Open' } },
    { select: { blockId: 'customer', value: null, from: 'shape' } },
  ]);
  expect(candidate.origin.flags).toEqual(['tokenised-text']);
  expect(candidate.contents).toContain('# clicked text not in config: t_0000000000a0c0e1');
});

test('compileTrace clusters labels built from values by block and counts their tokens', () => {
  const { candidates, segments } = compile({
    records: [
      ...productionVisit({
        session: 's1',
        clicks: [{ block: 'open_button', token: 't_000000000000e003' }],
      }),
      ...productionVisit({
        session: 's2',
        at: 100,
        clicks: [{ block: 'open_button', token: 't_000000000000e004' }],
      }),
    ],
    source: 'production',
  });
  expect(segments[0].hash).toBe(segments[1].hash);
  expect(candidates).toHaveLength(1);
  expect(candidates[0].journey.steps).toEqual([{ click: 'open_button' }]);
  expect(candidates[0].origin.text_tokens).toEqual([
    {
      page: 'tickets',
      block_id: 'open_button',
      column: null,
      clicks: 2,
      tokens: 2,
      top: [
        { token: 't_000000000000e003', clicks: 1, persons: 1 },
        { token: 't_000000000000e004', clicks: 1, persons: 1 },
      ],
    },
  ]);
});

test('compileTrace leaves a blockless click known only by a token for a person to write', () => {
  const { candidates } = compile({
    records: productionVisit({
      session: 's1',
      clicks: [
        { block: 'save', text: 'Save', token: 't_000000000000005a' },
        { token: 't_0000000000a0c0e1' },
      ],
    }),
    source: 'production',
  });
  expect(candidates[0].origin.flags).toEqual(['unresolved-target']);
  expect(candidates[0].contents).toContain(
    'click on a control known neither by block nor by kept text (clicked text not in config: t_0000000000a0c0e1): write the step by hand'
  );
});

test('compileTrace gives byte-identical production candidates when compiled twice', () => {
  const records = [
    ...productionVisit({
      session: 's1',
      clicks: [{ block: 'grid', row: 1, column: 'name', token: 't_0000000000a0c0e1' }],
    }),
    ...productionVisit({
      session: 's2',
      at: 100,
      clicks: [{ block: 'grid', row: 3, column: 'name', token: 't_00000000000b10be' }],
    }),
  ];
  expect(candidatesByName(compile({ records, source: 'production' }))).toEqual(
    candidatesByName(compile({ records, source: 'production' }))
  );
});

test('compileTrace gives byte-identical contents when the same records are compiled twice', () => {
  expect(candidatesByName(compile())).toEqual(candidatesByName(compile()));
});

test('compileTrace counts invalid and other-version records in dropped', () => {
  const { dropped } = compile({
    records: [...traceRecords, { v: 2 }, { not: 'a record' }],
  });
  expect(dropped).toEqual({
    invalid: 1,
    otherVersion: 1,
    reasons: ['Trace record "v" should be 1. Received undefined.'],
  });
});

test('compileTrace throws for an unknown source', () => {
  expect(() => compile({ source: 'replay' })).toThrow(
    'Journey compiler requires "source" to be one of production, dev, explorer, journey. Received "replay".'
  );
});

test('compileTrace gives each segment its entry page, pages, failure path and frustrations', () => {
  const records = [
    traceRecord({ at: 0, session: 'p-1', kind: 'pageview', url: '/tickets', source: 'production' }),
    traceRecord({
      at: 1,
      session: 'p-1',
      block: 'title',
      source: 'production',
      frustration: 'rage',
    }),
    traceRecord({
      at: 2,
      session: 'p-1',
      block: 'save',
      source: 'production',
      event: {
        name: 'onClick',
        block_id: 'save',
        success: false,
        error: { name: 'UserError', action_type: 'Validate' },
        invalid_blocks: ['title', 'due'],
      },
    }),
    traceRecord({
      at: 10,
      session: 'p-2',
      kind: 'pageview',
      url: '/tickets',
      source: 'production',
    }),
    traceRecord({ at: 11, session: 'p-2', block: 'save', source: 'production' }),
    traceRecord({
      at: 12,
      session: 'p-2',
      kind: 'engine',
      scope: 'app',
      source: 'production',
      event: { name: 'onInitAsync', block_id: 'root', success: false, error: { name: 'Error' } },
    }),
  ];
  const { segments } = compileTrace({ records, source: 'production' });
  expect(segments[0]).toMatchObject({
    page_id: 'tickets',
    pages: ['tickets'],
    failure_path: {
      page: 'tickets',
      block_id: 'save',
      event: 'onClick',
      invalid_blocks: ['due', 'title'],
      interaction: true,
    },
    frustrations: [{ page: 'tickets', block_id: 'title', text: null, kind: 'rage' }],
  });
  expect(segments[1].failure_path).toEqual({
    page: 'app',
    block_id: null,
    event: 'onInitAsync',
    invalid_blocks: [],
    interaction: false,
  });
  expect(segments[1].frustrations).toEqual([]);
});

test('compileTrace prepareCandidate can drop a candidate, drop steps and add to the origin', () => {
  const seen = [];
  const { candidates } = compileTrace({
    records: traceRecords,
    blockMetas,
    source: 'dev',
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
  expect(parseCandidateOrigin({ contents: candidate.contents }).explorer).toEqual({
    run: '20261004T120000Z-ab12cd',
    pr: null,
    walks: ['walk-1'],
  });
  expect(
    validateJourneySteps({ steps: YAML.parse(candidate.contents).steps }).error
  ).toBeUndefined();
});
