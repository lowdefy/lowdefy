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

import compileSegments from './compileSegments.js';
import traceRecord from './traceRecord.js';
import { blockMetas, traceRecords } from './testTrace.js';

// The shared corpus as a test run's journey records.
const runRecords = traceRecords.map((record) => ({ ...record, source: 'journey' }));

function shortFlow({ session, at, source = 'production' }) {
  return [
    traceRecord({ at, session, kind: 'pageview', url: '/tickets', source }),
    traceRecord({ at: at + 1, session, kind: 'change', block: 'title', source }),
    traceRecord({ at: at + 2, session, block: 'save', source }),
  ];
}

test('compileSegments returns every segment with its hash, sequence, steps and people', () => {
  const { segments } = compileSegments({ records: runRecords, blockMetas, source: 'journey' });
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

test('compileSegments leaves out segments with no interaction steps', () => {
  const { segments } = compileSegments({
    records: [
      traceRecord({ at: 0, kind: 'pageview', url: '/tickets', source: 'production' }),
      traceRecord({
        at: 1,
        kind: 'engine',
        source: 'production',
        event: { name: 'onMount', block_id: 'tickets', success: false, error: { name: 'E' } },
      }),
    ],
    source: 'production',
  });
  expect(segments).toEqual([]);
});

test('compileSegments leaves out records of other sources', () => {
  const { segments } = compileSegments({
    records: [
      ...shortFlow({ session: 's-1', at: 0 }),
      ...shortFlow({ session: 's-2', at: 100, source: 'journey' }),
    ],
    source: 'production',
  });
  expect(segments.map((segment) => segment.session)).toEqual(['s-1']);
});

test('compileSegments keeps only records inside the since and until window', () => {
  const { segments } = compileSegments({
    records: [
      ...shortFlow({ session: 's-1', at: 0 }),
      ...shortFlow({ session: 's-2', at: 1000 }),
      ...shortFlow({ session: 's-3', at: 2000 }),
    ],
    source: 'production',
    filters: { since: '2026-09-28T14:10:00.000Z', until: '2026-09-28T14:20:00.000Z' },
  });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
});

test('compileSegments counts invalid and other-version records in dropped', () => {
  const { dropped } = compileSegments({
    records: [...runRecords, { v: 2 }, { not: 'a record' }],
    source: 'journey',
  });
  expect(dropped).toEqual({
    invalid: 1,
    otherVersion: 1,
    reasons: ['Trace record "v" should be 1. Received undefined.'],
  });
});

test('compileSegments throws for a source it does not compile', () => {
  expect(() => compileSegments({ records: [], source: 'dev' })).toThrow(
    'compileSegments requires "source" to be one of production, journey. Received "dev".'
  );
});

test('compileSegments gives each segment its entry page, pages, failure path and frustrations', () => {
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
  const { segments } = compileSegments({ records, source: 'production' });
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

test('compileSegments keeps two config labels in one block apart and joins tokenised ones', () => {
  const visit = ({ session, at, click }) => [
    traceRecord({ at, session, kind: 'pageview', url: '/tickets', source: 'production' }),
    traceRecord({ at: at + 1, session, source: 'production', ...click }),
  ];
  const { segments } = compileSegments({
    records: [
      ...visit({ session: 's1', at: 0, click: { block: 'grid', row: 0, text: 'Assign' } }),
      ...visit({ session: 's2', at: 100, click: { block: 'grid', row: 0, text: 'Delete' } }),
      ...visit({ session: 's3', at: 200, click: { block: 'open', token: 't_000000000000e003' } }),
      ...visit({ session: 's4', at: 300, click: { block: 'open', token: 't_000000000000e004' } }),
    ],
    source: 'production',
  });
  expect(segments[0].hash).not.toBe(segments[1].hash);
  expect(segments[2].hash).toBe(segments[3].hash);
});

function clickThroughFlow({ session, at, source }) {
  return [
    traceRecord({ at, session, kind: 'pageview', url: '/tickets', source }),
    traceRecord({ at: at + 1, session, block: 'tickets_grid', row: 0, source }),
    traceRecord({
      at: at + 2,
      session,
      kind: 'pageview',
      url: source === 'production' ? '/app/tickets/s/1' : '/app/tickets/s/1?tab=notes',
      page: 'ticket',
      path_params: { space: 's', ticket_id: '1' },
      source,
    }),
    traceRecord({ at: at + 3, session, block: 'save', page: 'ticket', source }),
  ];
}

test('compileSegments reads the page a click navigated to through the route table', () => {
  const routeTable = {
    routes: [
      { pageId: 'tickets', path: 'tickets' },
      { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' },
    ],
    basePath: '/app',
  };
  const run = compileSegments({
    records: clickThroughFlow({ session: 'j-1', at: 0, source: 'journey' }),
    routeTable,
    source: 'journey',
  });
  const production = compileSegments({
    records: clickThroughFlow({ session: 'p-1', at: 0, source: 'production' }),
    routeTable,
    source: 'production',
  });
  expect(run.segments[0].sequence.map((entry) => entry.page)).toEqual(['tickets', 'ticket']);
  expect(production.segments[0].sequence).toEqual(run.segments[0].sequence);
  expect(production.segments[0].hash).toBe(run.segments[0].hash);
});
