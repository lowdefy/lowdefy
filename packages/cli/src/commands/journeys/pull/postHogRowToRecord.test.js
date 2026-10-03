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

import { validateTraceRecord } from '@lowdefy/node-utils';

import postHogRowToRecord from './postHogRowToRecord.js';
import { chains, row } from './tests/postHogRows.js';

const salt = Buffer.alloc(32, 1);
const T = '2026-10-01T10:00:00.123000Z';

function map(fields) {
  return postHogRowToRecord({ row: row({ uuid: 'u1', timestamp: T, ...fields }), salt });
}

test('postHogRowToRecord maps a pageview to its page from the pathname', () => {
  const { record } = map({ event: '$pageview', pathname: '/tickets', query: '?id=t-1&tab=open' });
  expect(record).toEqual({
    v: 1,
    source: 'production',
    session: '0192f3a4-0000-7000-8000-000000000001.0192f3a4-0000-7000-8000-0000000000aa',
    person: expect.stringMatching(/^p_[0-9a-f]{16}$/),
    org: expect.stringMatching(/^o_[0-9a-f]{16}$/),
    roles: ['member'],
    t: '2026-10-01T10:00:00.123Z',
    build: 'build-2026-10-01T09:00:00.000Z',
    page_id: 'tickets',
    scope: 'page',
    kind: 'pageview',
    url: '/tickets?id=&tab=',
    target: null,
  });
  expect(validateTraceRecord({ record })).toEqual({});
});

test('postHogRowToRecord prefers lowdefy_page_id to the pathname', () => {
  const { record } = map({
    event: '$pageview',
    pathname: '/tickets',
    lowdefy_page_id: 'ticket-list',
  });
  expect(record.page_id).toBe('ticket-list');
});

test('postHogRowToRecord drops the pageview at / as the home redirect', () => {
  expect(map({ event: '$pageview', pathname: '/' })).toEqual({ dropped: 'home_redirect' });
});

test('postHogRowToRecord drops a pageview whose path is not a page', () => {
  expect(map({ event: '$pageview', pathname: '/tickets/t-1' })).toEqual({ dropped: 'not_a_page' });
});

test('postHogRowToRecord keys the tab as <session>.<window>', () => {
  const { record } = map({ event: '$pageleave', sessionId: 's-1', windowId: 'w-2' });
  expect(record.session).toBe('s-1.w-2');
  expect(record.kind).toBe('pageleave');
});

test('postHogRowToRecord drops a submit autocapture as event_type', () => {
  expect(map({ eventType: 'submit', elementsChain: chains.menuLink })).toEqual({
    dropped: 'event_type',
  });
});

test('postHogRowToRecord drops a click with neither block nor text as no_target', () => {
  expect(map({ eventType: 'click', elementsChain: chains.noBlockNoText })).toEqual({
    dropped: 'no_target',
  });
});

test('postHogRowToRecord takes the build from lowdefy_build_id, null without one', () => {
  expect(map({ event: '$pageview' }).record.build).toBe('build-2026-10-01T09:00:00.000Z');
  expect(map({ event: '$pageview', lowdefy_build_id: null }).record.build).toBeNull();
});

test('postHogRowToRecord builds an enriched click target from lowdefy properties', () => {
  const result = map({
    eventType: 'click',
    elText: 'Review',
    elementsChain: null,
    lowdefy_block_id: 'groups.2.rows.0.review_button',
    lowdefy_block_ids: '["groups.2.rows.0.review_button","groups.2.rows","groups"]',
    lowdefy_block_type: 'Button',
  });
  expect(result.record.target).toEqual({
    block_id: 'groups.2.rows.0.review_button',
    block_type: 'Button',
    row: null,
    column: null,
    text: 'Review',
    nth: null,
    option: false,
  });
  expect(result.blockIds).toEqual(['groups.2.rows.0.review_button', 'groups.2.rows', 'groups']);
  expect(result.chainFallback).toBe(false);
  expect(result.record).not.toHaveProperty('event');
  expect(validateTraceRecord({ record: result.record })).toEqual({});
});

test('postHogRowToRecord reads a chain-only click target with no block type', () => {
  const result = map({ eventType: 'click', elText: 'Review', elementsChain: chains.listButton });
  expect(result.record.target).toEqual({
    block_id: 'groups.2.rows.0.review_button',
    block_type: null,
    row: null,
    column: null,
    text: 'Review',
    nth: null,
    option: false,
  });
  expect(result.blockIds).toEqual(['groups.2.rows.0.review_button', 'groups.2.rows', 'groups']);
  expect(result.chainFallback).toBe(true);
  expect(JSON.stringify(result.record)).not.toContain('bl-');
});

test('postHogRowToRecord keeps a portal dropdown item by its text', () => {
  const { record } = map({
    eventType: 'click',
    elText: 'Alice',
    elementsChain: chains.portalOption,
  });
  expect(record.target).toMatchObject({ block_id: null, text: 'Alice', option: true });
  expect(validateTraceRecord({ record })).toEqual({});
});

test('postHogRowToRecord maps an autocapture change to a change record without a value', () => {
  const { record } = map({ eventType: 'change', elementsChain: chains.radioInput });
  expect(record.kind).toBe('change');
  expect(record).not.toHaveProperty('value');
  expect(record).not.toHaveProperty('event');
  expect(validateTraceRecord({ record })).toEqual({});
});

test('postHogRowToRecord hands back a rage click as a frustration click', () => {
  const result = map({ event: '$rageclick', elText: 'Review', elementsChain: chains.listButton });
  expect(result.frustration).toMatchObject({ kind: 'click', frustration: 'rage' });
  expect(validateTraceRecord({ record: result.frustration })).toEqual({});
});

test('postHogRowToRecord hands back a failure with its pairing inputs', () => {
  const result = map({
    event: 'lowdefy_event_failed',
    lowdefy_page_id: 'tickets',
    lowdefy_block_id: 'save',
    lowdefy_block_type: 'Button',
    lowdefy_event_scope: 'page',
    lowdefy_event_name: 'onClick',
    lowdefy_debounce_ms: '0',
    lowdefy_action_id: 'validate',
    lowdefy_action_type: 'Validate',
    lowdefy_error_name: 'UserError',
    lowdefy_config_key: 'k-12',
    lowdefy_invalid_blocks: '["title"]',
  });
  expect(result.pairing).toEqual({
    blockId: 'save',
    eventName: 'onClick',
    startTimestamp: Date.parse('2026-10-01T10:00:00.123Z'),
    debounceMs: 0,
    scope: 'page',
  });
  expect(result.failure.event).toEqual({
    name: 'onClick',
    block_id: 'save',
    success: false,
    error: {
      name: 'UserError',
      action_type: 'Validate',
      config_key: 'k-12',
      action_id: 'validate',
    },
    invalid_blocks: ['title'],
  });
  expect(validateTraceRecord({ record: result.failure })).toEqual({});
});

test('postHogRowToRecord sets org null and keeps roles as they are', () => {
  const { record } = map({ event: '$pageview', orgId: null, roles: '[]' });
  expect(record.org).toBeNull();
  expect(record.roles).toEqual([]);
  expect(map({ event: '$pageview', personId: 'anon', roles: null }).record.roles).toBeNull();
});

test('postHogRowToRecord reads a zoneless ClickHouse timestamp as UTC', () => {
  const { record } = map({ event: '$pageview', timestamp: '2026-10-01 10:00:00.123456' });
  expect(record.t).toBe('2026-10-01T10:00:00.123Z');
});
