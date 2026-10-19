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

import validateTraceRecord from './validateTraceRecord.js';

// The sample record of the trace format, with its comments removed.
const sample = {
  v: 1,
  source: 'dev',
  session: '20261003T140311Z-k3x9qa',
  person: null,
  org: null,
  roles: ['member'],
  t: '2026-09-28T14:03:11.204Z',
  build: '2026-09-28T14:01:02.000Z',
  run: null,
  page_id: 'tickets',
  url: '/tickets?id=t-1',
  scope: 'page',
  kind: 'click',
  target: {
    block_id: 'tickets_grid',
    block_type: 'AgGridAlpine',
    row: 3,
    column: 'actions',
    text: 'Assign',
    nth: null,
    option: false,
  },
  event: {
    name: 'onCellClick',
    block_id: 'tickets_grid',
    success: false,
    error: {
      name: 'UserError',
      config_key: 'k1',
      action_type: 'Validate',
      action_id: 'validate_assign',
    },
    invalid_blocks: ['assignee'],
    requests: [{ id: 'assign_ticket', ok: true, ms: 212 }],
    state_writes: [{ path: 'assignee', type: 'string', value: 'u_17' }],
    url_after: '/tickets?id=t-1',
  },
  also: [],
  frustration: null,
};

const production = {
  v: 1,
  source: 'production',
  session: 'sess.win',
  person: 'p_1',
  org: 'o_1',
  roles: null,
  t: '2026-09-28T14:03:11.204Z',
  build: null,
  page_id: 'tickets',
  url: '/tickets?id=',
  scope: 'page',
  kind: 'click',
  target: { block_id: 'save', block_type: 'Button', text: 'Save', option: false },
};

function check(record) {
  return validateTraceRecord({ record }).error;
}

test('validateTraceRecord accepts the sample record of the trace format', () => {
  expect(validateTraceRecord({ record: sample })).toEqual({});
});

test('validateTraceRecord refuses a record that is not an object', () => {
  expect(check('click')).toBe('Trace record should be an object. Received "click".');
});

test('validateTraceRecord refuses a version other than 1', () => {
  expect(check({ ...sample, v: 2 })).toBe('Trace record "v" should be 1. Received 2.');
});

test('validateTraceRecord refuses a source outside the list', () => {
  expect(check({ ...sample, source: 'replay' })).toBe(
    'Trace record "source" should be one of production, dev, journey. Received "replay".'
  );
});

test('validateTraceRecord refuses a kind outside the list', () => {
  expect(check({ ...sample, kind: 'hover' })).toContain('Trace record "kind" should be one of');
});

test('validateTraceRecord refuses a scope outside the list', () => {
  expect(check({ ...sample, scope: 'block' })).toContain('Trace record "scope" should be one of');
});

test('validateTraceRecord refuses a time that does not parse', () => {
  expect(check({ ...sample, t: 'yesterday' })).toBe(
    'Trace record "t" should be an ISO date string. Received "yesterday".'
  );
});

test('validateTraceRecord refuses an empty session or page id', () => {
  expect(check({ ...sample, session: '' })).toContain('"session" should be a non-empty string');
  expect(check({ ...sample, page_id: undefined })).toContain(
    '"page_id" should be a non-empty string'
  );
});

test('validateTraceRecord requires a url on a pageview', () => {
  const pageview = { ...sample, kind: 'pageview', target: null, event: null };
  expect(check({ ...pageview, url: undefined })).toBe(
    'Trace record of kind "pageview" requires a "url". Received undefined.'
  );
  expect(check(pageview)).toBeUndefined();
});

test('validateTraceRecord accepts path_params of strings on a pageview only', () => {
  const pageview = {
    ...sample,
    kind: 'pageview',
    page_id: 'ticket',
    url: '/tickets/s/1',
    path_params: { space: 's', ticket_id: '1' },
    target: null,
    event: null,
  };
  expect(check(pageview)).toBeUndefined();
  expect(check({ ...pageview, path_params: { ticket_id: 1 } })).toBe(
    'Trace record "path_params" should be an object of strings, one per path placeholder. Received {"ticket_id":1}.'
  );
  expect(check({ ...sample, path_params: { ticket_id: '1' } })).toBe(
    'Trace record "path_params" appears only on "pageview" records. Received {"ticket_id":"1"} on a click record.'
  );
});

test('validateTraceRecord requires a target on click and change', () => {
  expect(check({ ...sample, target: null })).toBe(
    'Trace record "target" should be an object. Received null.'
  );
  expect(check({ ...sample, kind: 'change', target: undefined, value: 'x' })).toContain(
    '"target" should be an object'
  );
});

test('validateTraceRecord accepts a key record with or without a target', () => {
  const key = { ...sample, kind: 'key', key: 'Enter', event: null };
  expect(check(key)).toBeUndefined();
  expect(check({ ...key, target: null })).toBeUndefined();
});

test('validateTraceRecord refuses a target on pageview, back, pageleave and engine records', () => {
  ['pageview', 'back', 'pageleave'].forEach((kind) => {
    expect(check({ ...sample, kind, event: null })).toContain(
      `Trace record of kind "${kind}" should have a null "target".`
    );
  });
  expect(check({ ...sample, kind: 'engine' })).toContain(
    'Trace record of kind "engine" should have a null "target".'
  );
});

test('validateTraceRecord requires a block_id, a text or a text_token on a target', () => {
  expect(check({ ...sample, target: { row: 1 } })).toBe(
    'Trace record "target" requires a "block_id", a "text" or a "text_token". Received {"row":1}.'
  );
  expect(check({ ...sample, target: { text: 'Save' } })).toBeUndefined();
  expect(check({ ...sample, target: { text_token: 't_0123456789abcdef' } })).toBeUndefined();
});

test('validateTraceRecord requires a text_token to be t_ and 16 hex characters', () => {
  expect(
    check({ ...sample, target: { ...sample.target, text_token: 't_0123456789abcdef' } })
  ).toBeUndefined();
  expect(check({ ...sample, target: { ...sample.target, text_token: 'Acme Ltd' } })).toBe(
    'Trace record "target.text_token" should be "t_" and 16 hex characters, or null. Received "Acme Ltd".'
  );
  expect(
    check({ ...sample, target: { block_id: 'grid', text_token: 'p_0123456789abcdef' } })
  ).toContain('"target.text_token" should be');
});

test('validateTraceRecord requires zero-based integers or null for row and nth', () => {
  expect(check({ ...sample, target: { ...sample.target, row: -1 } })).toContain(
    '"target.row" should be a zero-based integer or null. Received -1.'
  );
  expect(check({ ...sample, target: { ...sample.target, nth: 1.5 } })).toContain(
    '"target.nth" should be a zero-based integer or null. Received 1.5.'
  );
  expect(check({ ...sample, target: { ...sample.target, row: null, nth: 0 } })).toBeUndefined();
});

test('validateTraceRecord requires a string or null block_type', () => {
  expect(check({ ...sample, target: { ...sample.target, block_type: 3 } })).toContain(
    '"target.block_type" should be a string or null. Received 3.'
  );
  expect(check({ ...sample, target: { ...sample.target, block_type: null } })).toBeUndefined();
});

test('validateTraceRecord requires a boolean option', () => {
  expect(check({ ...sample, target: { ...sample.target, option: 'yes' } })).toContain(
    '"target.option" should be a boolean. Received "yes".'
  );
});

test('validateTraceRecord refuses a target that carries page_id or block_ids', () => {
  expect(check({ ...sample, target: { ...sample.target, page_id: 'tickets' } })).toContain(
    'should not carry "page_id" or "block_ids"'
  );
  expect(check({ ...sample, target: { ...sample.target, block_ids: ['tickets_grid'] } })).toContain(
    'should not carry "page_id" or "block_ids"'
  );
});

test('validateTraceRecord refuses a value on any record but a change', () => {
  expect(check({ ...sample, value: 'x' })).toBe(
    'Trace record "value" appears only on "change" records. Received "x" on a click record.'
  );
  expect(check({ ...sample, kind: 'change', value: 'x' })).toBeUndefined();
});

test('validateTraceRecord requires a key on a key record', () => {
  expect(check({ ...sample, kind: 'key', event: null })).toBe(
    'Trace record of kind "key" requires a "key" chord string, as "Enter" or "Mod+k". Received undefined.'
  );
});

test('validateTraceRecord refuses a key on any record but a key record', () => {
  expect(check({ ...sample, key: 'Enter' })).toContain(
    'Trace record "key" appears only on "key" records.'
  );
});

test('validateTraceRecord accepts redacted only with a null value on a change', () => {
  const change = { ...sample, kind: 'change' };
  expect(check({ ...change, value: null, redacted: true })).toBeUndefined();
  expect(check({ ...change, value: 'hunter2', redacted: true })).toContain(
    '"redacted: true" appears only on a "change" record with "value: null"'
  );
  expect(check({ ...sample, redacted: true })).toContain('"redacted: true" appears only');
});

test('validateTraceRecord accepts redacted only with a null value on a state write', () => {
  const withWrite = (write) => ({ ...sample, event: { ...sample.event, state_writes: [write] } });
  expect(
    check(withWrite({ path: 'password', type: 'string', value: null, redacted: true }))
  ).toBeUndefined();
  expect(
    check(withWrite({ path: 'password', type: 'string', value: 'x', redacted: true }))
  ).toContain('may carry "redacted: true" only with "value: null"');
});

test('validateTraceRecord refuses redacted on a production record', () => {
  expect(check({ ...production, kind: 'change', redacted: true })).toBe(
    'Trace record "redacted" should never appear on a production record. Received true.'
  );
  expect(
    check({
      ...production,
      event: {
        name: 'onClick',
        block_id: 'save',
        success: false,
        state_writes: [{ path: 'p', type: 'string', redacted: true }],
      },
    })
  ).toContain('entry on a production record should carry no "redacted"');
});

test('validateTraceRecord accepts run only on journey records', () => {
  const run = { id: 'run-1', by: 'agent', journey: 'save-ticket', actor: 'main' };
  expect(check({ ...sample, run })).toBe(
    'Trace record "run" appears only on journey records. Received {"id":"run-1","by":"agent","journey":"save-ticket","actor":"main"} on a dev record.'
  );
  expect(check({ ...sample, source: 'journey', run })).toBeUndefined();
});

test('validateTraceRecord requires a run id string', () => {
  expect(check({ ...sample, source: 'journey', run: { id: 3 } })).toContain(
    '"run" should be { id, by, journey, actor } with an "id" string'
  );
});

test('validateTraceRecord refuses an absent event on a non-production record', () => {
  const { event, ...withoutEvent } = sample;
  expect(check(withoutEvent)).toBe(
    'Trace record from a dev source requires an "event" key: an object, or null when no event ran.'
  );
  expect(check({ ...withoutEvent, event: null })).toBeUndefined();
});

test('validateTraceRecord accepts a production record with no event key', () => {
  expect(validateTraceRecord({ record: production })).toEqual({});
});

test('validateTraceRecord refuses event null on a production record', () => {
  expect(check({ ...production, event: null })).toBe(
    'Trace record "event" on a production record should be an object or absent: production sees only failures, so it cannot know that no event ran. Received null.'
  );
});

test('validateTraceRecord refuses a value on a production record', () => {
  expect(check({ ...production, kind: 'change', value: 'Grace' })).toBe(
    'Trace record "value" should never appear on a production record. Received "Grace".'
  );
});

test('validateTraceRecord refuses a state write value on a production record', () => {
  expect(
    check({
      ...production,
      event: {
        name: 'onClick',
        block_id: 'save',
        success: false,
        state_writes: [{ path: 'assignee', type: 'string', value: 'u_17' }],
      },
    })
  ).toContain('entry on a production record should carry no "value"');
});

test('validateTraceRecord refuses query values in a production url', () => {
  expect(check({ ...production, url: '/tickets?id=t-1' })).toBe(
    'Trace record "url" on a production record should carry query keys only, as "?id=&tab=". Received "/tickets?id=t-1".'
  );
  expect(check({ ...production, url: '/tickets?id=&tab=' })).toBeUndefined();
});

test('validateTraceRecord requires an event object and no target on an engine record', () => {
  const engine = { ...sample, kind: 'engine', target: null };
  expect(check({ ...engine, event: null })).toBe(
    'Trace record of kind "engine" requires an "event" object. Received null.'
  );
  expect(check(engine)).toBeUndefined();
});

test('validateTraceRecord accepts scope app only on engine records', () => {
  expect(check({ ...sample, scope: 'app' })).toBe(
    'Trace record with scope "app" should be of kind "engine". Received kind "click".'
  );
  expect(check({ ...sample, scope: 'app', kind: 'engine', target: null })).toBeUndefined();
});

test('validateTraceRecord requires each also entry to have the shape of an event', () => {
  expect(check({ ...sample, also: [{ name: 'onClick', block_id: 'card', success: true }] })).toBe(
    undefined
  );
  expect(check({ ...sample, also: [{ name: 'onClick', success: true }] })).toBe(
    'Trace record "also[0].block_id" should be a non-empty string. Received undefined.'
  );
});

test('validateTraceRecord refuses an event success outside true, false and null', () => {
  expect(check({ ...sample, event: { ...sample.event, success: 'ok' } })).toBe(
    'Trace record "event.success" should be true, false or null. Received "ok".'
  );
});

test('validateTraceRecord refuses a frustration outside rage and dead', () => {
  expect(check({ ...production, frustration: 'angry' })).toContain(
    '"frustration" should be one of rage, dead or null'
  );
  expect(check({ ...production, frustration: 'dead' })).toBeUndefined();
});
