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

import { compileTrace, profileProduction, validateTraceRecord } from '@lowdefy/node-utils';

import buildDayRecords from './buildDayRecords.js';
import { chains, ORG_ID, PERSON_ID, row, SESSION_ID } from './tests/postHogRows.js';

const salt = Buffer.alloc(32, 3);

function at(ms) {
  return new Date(Date.parse('2026-10-01T10:00:00.000Z') + ms).toISOString();
}

function failure({ uuid, ms, blockId = 'save', scope = 'page', eventName = 'onClick', ...rest }) {
  return row({
    uuid,
    timestamp: at(ms),
    event: 'lowdefy_event_failed',
    lowdefy_page_id: 'tickets',
    lowdefy_block_id: blockId,
    lowdefy_event_scope: scope,
    lowdefy_event_name: eventName,
    lowdefy_debounce_ms: 0,
    lowdefy_action_id: 'validate',
    lowdefy_action_type: 'Validate',
    lowdefy_error_name: 'UserError',
    lowdefy_config_key: 'k-1',
    ...rest,
  });
}

function click({ uuid, ms, blockId = 'save', blockIds, chain, text = 'Save', ...rest }) {
  if (chain) {
    return row({
      uuid,
      timestamp: at(ms),
      eventType: 'click',
      elText: text,
      elementsChain: chain,
      ...rest,
    });
  }
  return row({
    uuid,
    timestamp: at(ms),
    eventType: 'click',
    elText: text,
    lowdefy_block_id: blockId,
    lowdefy_block_ids: blockIds ?? [blockId],
    lowdefy_block_type: 'Button',
    ...rest,
  });
}

// One morning on the tickets page, enriched and chain-only rows mixed.
const DAY_ROWS = [
  row({ uuid: 'r01', timestamp: at(0), event: '$pageview', pathname: '/', query: '' }),
  row({ uuid: 'r02', timestamp: at(100), event: '$pageview', query: '?id=t-1&tab=open' }),
  // The antd radio click: label click, input click, input change.
  row({
    uuid: 'r03',
    timestamp: at(1000),
    eventType: 'click',
    elText: 'High',
    elementsChain: chains.radioLabel,
  }),
  row({ uuid: 'r04', timestamp: at(1001), eventType: 'click', elementsChain: chains.radioInput }),
  row({ uuid: 'r05', timestamp: at(1002), eventType: 'change', elementsChain: chains.radioInput }),
  row({
    uuid: 'r06',
    timestamp: at(2000),
    eventType: 'click',
    elText: 'Alice',
    elementsChain: chains.portalOption,
  }),
  row({ uuid: 'r07', timestamp: at(3000), eventType: 'submit', elementsChain: chains.menuLink }),
  click({ uuid: 'r08', ms: 4000, blockId: 'groups.2.rows.0.review_button', text: 'Review' }),
  click({ uuid: 'r09', ms: 5000, chain: chains.menuLink, text: 'Tickets' }),
  row({ uuid: 'r10', timestamp: at(5500), event: '$pageleave' }),
];

test('buildDayRecords writes only records that pass validateTraceRecord', () => {
  const { records } = buildDayRecords({ rows: DAY_ROWS, salt });
  expect(records.length).toBeGreaterThan(0);
  records.forEach((record) => {
    expect(validateTraceRecord({ record })).toEqual({});
  });
});

test('buildDayRecords orders records by time and counts rows, drops and enrichment', () => {
  const result = buildDayRecords({ rows: DAY_ROWS, salt });
  expect(result.records.map((record) => record.kind)).toEqual([
    'pageview',
    'click',
    'click',
    'change',
    'click',
    'click',
    'click',
    'pageleave',
  ]);
  expect(result.dropped).toEqual({ home_redirect: 1, event_type: 1 });
  expect(result.rowsByEvent).toEqual({ $pageview: 2, $autocapture: 7, $pageleave: 1 });
  expect(result.interactions).toBe(7);
  expect(result.enriched).toBe(1);
  expect(result.chainFallbacks).toBe(5);
});

test('buildDayRecords leaves event out of every record that is not a failure', () => {
  const { records } = buildDayRecords({ rows: DAY_ROWS, salt });
  records.forEach((record) => {
    expect(record).not.toHaveProperty('event');
  });
});

test('buildDayRecords pairs a Validate failure starting 300 ms after a click on its block', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0 }),
      failure({ uuid: 'f1', ms: 300, lowdefy_invalid_blocks: ['title'] }),
    ],
    salt,
  });
  expect(records).toHaveLength(1);
  expect(records[0].kind).toBe('click');
  expect(records[0].event).toEqual({
    name: 'onClick',
    block_id: 'save',
    success: false,
    error: { name: 'UserError', action_type: 'Validate', config_key: 'k-1', action_id: 'validate' },
    invalid_blocks: ['title'],
  });
});

test('buildDayRecords keeps a failure beyond debounce plus the slack as an engine record', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0 }),
      failure({ uuid: 'f1', ms: 1301, lowdefy_debounce_ms: 300 }),
    ],
    salt,
  });
  expect(records.map((record) => record.kind)).toEqual(['click', 'engine']);
  expect(records[0]).not.toHaveProperty('event');
  expect(records[1]).toMatchObject({
    kind: 'engine',
    scope: 'page',
    page_id: 'tickets',
    target: null,
  });
  expect(validateTraceRecord({ record: records[1] })).toEqual({});
});

test('buildDayRecords pairs a Card failure with a click on a Title inside it through lowdefy_block_ids', () => {
  const { records } = buildDayRecords({
    rows: [
      click({
        uuid: 'c1',
        ms: 0,
        blockId: 'ticket_title',
        blockIds: ['ticket_title', 'ticket_card'],
        text: 'Ticket T-1',
      }),
      failure({ uuid: 'f1', ms: 200, blockId: 'ticket_card' }),
    ],
    salt,
  });
  expect(records).toHaveLength(1);
  expect(records[0].target.block_id).toBe('ticket_title');
  expect(records[0].event.block_id).toBe('ticket_card');
});

test('buildDayRecords pairs a Card failure with a Title click through the chain on a chain-only row', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0, chain: chains.cardTitle, text: 'Ticket T-1' }),
      failure({ uuid: 'f1', ms: 200, blockId: 'ticket_card' }),
    ],
    salt,
  });
  expect(records).toHaveLength(1);
  expect(records[0].event.block_id).toBe('ticket_card');
  expect(JSON.stringify(records)).not.toContain('block_ids');
});

test('buildDayRecords puts the second failure a click caused in also', () => {
  const { records } = buildDayRecords({
    rows: [
      click({
        uuid: 'c1',
        ms: 0,
        blockId: 'ticket_title',
        blockIds: ['ticket_title', 'ticket_card'],
      }),
      failure({ uuid: 'f1', ms: 100, blockId: 'ticket_card' }),
      failure({ uuid: 'f2', ms: 150, blockId: 'ticket_title' }),
    ],
    salt,
  });
  expect(records[0].event.block_id).toBe('ticket_title');
  expect(records[0].also.map((event) => event.block_id)).toEqual(['ticket_card']);
});

test('buildDayRecords keeps an app failure as an engine record with scope app', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0 }),
      failure({ uuid: 'f1', ms: 10, scope: 'app', blockId: 'app', eventName: 'onInitAsync' }),
    ],
    salt,
  });
  expect(records[1]).toMatchObject({ kind: 'engine', scope: 'app' });
  expect(records[1].event.name).toBe('onInitAsync');
  expect(validateTraceRecord({ record: records[1] })).toEqual({});
});

// An app that serves its home page at `/` renders it there with no redirect,
// so the app events run with `$pathname: /`. The plugin names the page the app
// loaded on in lowdefy_page_id, and `app` as the block, so the failure keeps
// its page and is not dropped with the root pageview's missing name.
test('buildDayRecords keeps an app failure captured at the root path and profiles it as app.<event>', () => {
  const { records, dropped } = buildDayRecords({
    rows: [
      row({
        uuid: 'p1',
        timestamp: at(0),
        event: '$pageview',
        pathname: '/',
        lowdefy_page_id: 'tickets',
      }),
      failure({
        uuid: 'f1',
        ms: 5,
        pathname: '/',
        scope: 'app',
        blockId: 'app',
        eventName: 'onInitAsync',
        lowdefy_action_type: 'CallAPI',
        lowdefy_error_name: 'RequestError',
      }),
      click({ uuid: 'c1', ms: 2000, pathname: '/', lowdefy_page_id: 'tickets' }),
    ],
    salt,
  });
  expect(dropped).toEqual({});
  expect(records.map((record) => record.kind)).toEqual(['pageview', 'engine', 'click']);
  expect(records[1]).toMatchObject({ kind: 'engine', scope: 'app', page_id: 'tickets', url: '/' });
  records.forEach((record) => expect(validateTraceRecord({ record })).toEqual({}));

  const { segments } = compileTrace({ records, blockMetas: {}, source: 'production' });
  const { failurePaths } = profileProduction({ segments });
  expect(failurePaths.map((path) => path.key)).toEqual(['app.onInitAsync']);
});

test('buildDayRecords does not pair across tabs', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0, windowId: 'w-1' }),
      failure({ uuid: 'f1', ms: 100, windowId: 'w-2' }),
    ],
    salt,
  });
  expect(records.map((record) => record.kind)).toEqual(['click', 'engine']);
});

test('buildDayRecords attaches a rage click to the prior click on the same target', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0 }),
      row({
        uuid: 'g1',
        timestamp: at(700),
        event: '$rageclick',
        elText: 'Save',
        lowdefy_block_id: 'save',
        lowdefy_block_type: 'Button',
      }),
    ],
    salt,
  });
  expect(records).toHaveLength(1);
  expect(records[0].frustration).toBe('rage');
});

test('buildDayRecords keeps a dead click with no click before it as its own click', () => {
  const { records } = buildDayRecords({
    rows: [
      click({ uuid: 'c1', ms: 0 }),
      row({
        uuid: 'g1',
        timestamp: at(5000),
        event: '$dead_click',
        elText: 'Ticket T-1',
        elementsChain: chains.cardTitle,
      }),
    ],
    salt,
  });
  expect(records).toHaveLength(2);
  expect(records[0]).not.toHaveProperty('frustration');
  expect(records[1]).toMatchObject({ kind: 'click', frustration: 'dead' });
  expect(records[1].target.block_id).toBe('ticket_title');
});

test('buildDayRecords gives byte-identical output for the same salt', () => {
  const first = JSON.stringify(buildDayRecords({ rows: DAY_ROWS, salt }).records);
  const second = JSON.stringify(buildDayRecords({ rows: DAY_ROWS, salt }).records);
  expect(second).toBe(first);
});

test('buildDayRecords gives equal distinct person and org counts under two salts', () => {
  const rows = [
    ...DAY_ROWS,
    row({ uuid: 'x1', timestamp: at(9000), event: '$pageview', personId: 'p-2', orgId: 'org-2' }),
    row({ uuid: 'x2', timestamp: at(9100), event: '$pageview', personId: 'p-3', orgId: 'org-2' }),
  ];
  function distinct(records, key) {
    return new Set(records.map((record) => record[key]).filter((value) => value !== null)).size;
  }
  const a = buildDayRecords({ rows, salt }).records;
  const b = buildDayRecords({ rows, salt: Buffer.alloc(32, 9) }).records;
  expect(distinct(a, 'person')).toBe(3);
  expect(distinct(b, 'person')).toBe(3);
  expect(distinct(a, 'org')).toBe(2);
  expect(distinct(b, 'org')).toBe(2);
  expect(a[0].person).not.toBe(b[0].person);
});

test('buildDayRecords writes no raw person id, org id, chain fragment or query value', () => {
  const output = JSON.stringify(buildDayRecords({ rows: DAY_ROWS, salt }));
  [PERSON_ID, ORG_ID, 't-1', 'attr__', 'nth-child', 'ant-radio', 'bl-'].forEach((fragment) => {
    expect(output).not.toContain(fragment);
  });
  expect(output).toContain(SESSION_ID);
});
