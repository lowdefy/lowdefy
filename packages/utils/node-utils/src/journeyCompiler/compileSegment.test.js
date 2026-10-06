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

import compileSegment from './compileSegment.js';
import traceRecord from './traceRecord.js';
import validateJourneySteps from '../journeyGrammar/validateJourneySteps.js';

const blockMetas = {
  Button: { category: 'button' },
  TextInput: { category: 'input', valueType: 'string' },
  NumberInput: { category: 'input', valueType: 'number' },
  Selector: { category: 'input', valueType: 'any' },
  DateSelector: { category: 'input', valueType: 'date' },
  ControlledList: { category: 'list', valueType: 'object' },
};

const entry = traceRecord({ at: 0, kind: 'pageview', url: '/tickets' });
const prodEntry = traceRecord({ at: 0, kind: 'pageview', url: '/tickets', source: 'production' });

function event(rest = {}) {
  return { name: 'onClick', block_id: 'save', success: true, ...rest };
}

// Every journey these tests compile must be one the runner accepts.
function compile(records, { source = records[0].source } = {}) {
  const result = compileSegment({ records, blockMetas, source, name: 'tickets recorded test' });
  expect(validateJourneySteps({ steps: result.journey.steps })).toEqual({});
  return result;
}

function steps(records, options) {
  return compile(records, options).journey.steps;
}

test('T1 the first pageview gives the journey pageId and urlQuery', () => {
  const { journey } = compile([
    traceRecord({ at: 0, kind: 'pageview', url: '/tickets?id=t-1&tab=open' }),
    traceRecord({ at: 1, block: 'save' }),
  ]);
  expect(journey).toEqual({
    name: 'tickets recorded test',
    pageId: 'tickets',
    urlQuery: { id: 't-1', tab: 'open' },
    steps: [{ click: 'save' }],
  });
});

test('T1 a pageview of a patterned page gives the journey its page id and path values', () => {
  const { journey } = compile([
    traceRecord({
      at: 0,
      kind: 'pageview',
      page: 'ticket',
      url: '/tickets/s/1?tab=open',
      path_params: { space: 's', ticket_id: '1' },
    }),
    traceRecord({ at: 1, page: 'ticket', block: 'save' }),
  ]);
  expect(journey).toEqual({
    name: 'tickets recorded test',
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
    urlQuery: { tab: 'open' },
    steps: [{ click: 'save' }],
  });
});

test('T1 a pageview with no path values gives the journey no pathParams', () => {
  const { journey } = compile([
    traceRecord({ at: 0, kind: 'pageview', url: '/tickets', path_params: {} }),
    traceRecord({ at: 1, block: 'save' }),
  ]);
  expect(journey).toEqual({
    name: 'tickets recorded test',
    pageId: 'tickets',
    steps: [{ click: 'save' }],
  });
});

test('T2 a production entry gives the query keys with null values and a comment', () => {
  const { journey, comments } = compile([
    traceRecord({ at: 0, kind: 'pageview', url: '/tickets?id=&tab=', source: 'production' }),
    traceRecord({ at: 1, block: 'save', source: 'production' }),
  ]);
  expect(journey.urlQuery).toEqual({ id: null, tab: null });
  expect(comments.get(0)).toBe(
    'urlQuery values are not recorded in production: fill them in before running this journey'
  );
});

test('T3 a caused pageview gives an expect.url with path and query', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, block: 'open', event: null }),
      traceRecord({
        at: 2,
        kind: 'pageview',
        page: 'orders',
        url: '/orders/o-1?tab=items',
        caused: true,
      }),
    ])
  ).toEqual([{ click: 'open' }, { expect: { url: { contains: '/orders/o-1?tab=items' } } }]);
});

test('T4 a caused production pageview gives an expect.url with the path only', () => {
  expect(
    steps([
      prodEntry,
      traceRecord({ at: 1, block: 'open', source: 'production' }),
      traceRecord({
        at: 2,
        kind: 'pageview',
        page: 'orders',
        url: '/orders?id=',
        caused: true,
        source: 'production',
      }),
    ])
  ).toEqual([{ click: 'open' }, { expect: { url: { contains: '/orders' } } }]);
});

test('T5 a back gives back true and absorbs the pageview it caused', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, kind: 'back' }),
      traceRecord({ at: 2, kind: 'pageview', page: 'home', url: '/home', caused: true }),
      traceRecord({ at: 3, block: 'next' }),
    ])
  ).toEqual([{ back: true }, { click: 'next' }]);
});

test('T6 a click with only a block gives the string form', () => {
  expect(steps([entry, traceRecord({ at: 1, block: 'save' })])).toEqual([{ click: 'save' }]);
});

test('T7 a click with row, column, text or nth gives the object form without nulls', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, block: 'grid', row: 3, column: 'actions', text: 'Assign' }),
      traceRecord({ at: 3, text: 'OK', nth: 1 }),
    ])
  ).toEqual([
    { click: { blockId: 'grid', row: 3, column: 'actions', text: 'Assign' } },
    { click: { text: 'OK', nth: 1 } },
  ]);
});

test('T8 a click with no observed event is still a step', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, block: 'tabs', text: 'Settings', event: null }),
      traceRecord({ at: 3, block: 'save' }),
    ])
  ).toEqual([{ click: { blockId: 'tabs', text: 'Settings' } }, { click: 'save' }]);
  expect(steps([prodEntry, traceRecord({ at: 1, block: 'save', source: 'production' })])).toEqual([
    { click: 'save' },
  ]);
});

test('T9 a dead click in production adds a comment above its step', () => {
  const { journey, comments } = compile([
    prodEntry,
    traceRecord({ at: 1, block: 'label', source: 'production', frustration: 'dead' }),
  ]);
  expect(journey.steps).toEqual([{ click: 'label' }]);
  expect(comments.get(0)).toBe('dead click in production: assert what this should do');
});

test('T10 an option click gives a select with the option text', () => {
  expect(
    steps([entry, traceRecord({ at: 1, block: 'owner', text: 'Grace', option: true })])
  ).toEqual([{ select: { blockId: 'owner', value: 'Grace' } }]);
});

test('T11 a production option click with no config text gives a select placeholder', () => {
  expect(
    steps([prodEntry, traceRecord({ at: 1, block: 'owner', option: true, source: 'production' })])
  ).toEqual([{ select: { blockId: 'owner', value: null, from: 'shape' } }]);
});

test('a production click whose token is not config text compiles without text and is flagged', () => {
  const { journey, comments, flags } = compile([
    prodEntry,
    traceRecord({
      at: 1,
      block: 'grid',
      row: 4,
      column: 'name',
      token: 't_00000000000000c1',
      source: 'production',
    }),
  ]);
  expect(journey.steps).toEqual([{ click: { blockId: 'grid', row: 4, column: 'name' } }]);
  expect(comments.get(0)).toBe('clicked text not in config: t_00000000000000c1');
  expect(flags).toEqual(['tokenised-text']);
});

test('T12 a change gives a fill with the recorded value, else the state write for the block', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, kind: 'change', block: 'title', blockType: 'TextInput', value: 'Ada' }),
      traceRecord({
        at: 5,
        kind: 'change',
        block: 'qty',
        blockType: 'NumberInput',
        event: event({
          name: 'onChange',
          block_id: 'qty',
          state_writes: [{ path: 'qty', type: 'number', value: 25 }],
        }),
      }),
    ])
  ).toEqual([
    { fill: { blockId: 'title', value: 'Ada', from: 'recorded' } },
    { fill: { blockId: 'qty', value: 25, from: 'recorded' } },
    { expect: { state: { path: 'qty', equals: 25, from: 'recorded' } } },
  ]);
});

test('T13 a production change gives a fill placeholder and no state expectation', () => {
  expect(
    steps([prodEntry, traceRecord({ at: 1, kind: 'change', block: 'title', source: 'production' })])
  ).toEqual([{ fill: { blockId: 'title', value: null, from: 'shape' } }]);
});

test('T14 a redacted change gives a fill placeholder and the password comment', () => {
  const { journey, comments } = compile([
    entry,
    traceRecord({ at: 1, kind: 'change', block: 'password', value: null, redacted: true }),
  ]);
  expect(journey.steps).toEqual([{ fill: { blockId: 'password', value: null, from: 'shape' } }]);
  expect(comments.get(0)).toBe("password not recorded: fill from the journey's user");
});

test('T15 a change or click on a date or object input gives the manual-input comment and flag', () => {
  const { journey, footer, flags } = compile([
    entry,
    traceRecord({ at: 1, block: 'due', blockType: 'DateSelector' }),
    traceRecord({ at: 2, kind: 'change', block: 'due', blockType: 'DateSelector', value: 'x' }),
    traceRecord({ at: 5, kind: 'change', block: 'items', blockType: 'ControlledList', value: {} }),
  ]);
  expect(journey.steps).toEqual([]);
  expect(footer).toBe(
    [
      'due (DateSelector): no v7 journey verb drives this input; write the step by hand',
      'items (ControlledList): no v7 journey verb drives this input; write the step by hand',
    ].join('\n')
  );
  expect(flags).toEqual(['manual-input']);
});

test('T16 a key gives a press of its chord', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, kind: 'key', block: 'search', key: 'Enter' }),
      traceRecord({ at: 2, kind: 'key', key: 'Mod+k' }),
    ])
  ).toEqual([{ press: 'Enter' }, { press: 'Mod+k' }]);
});

test('T17 a single printable character with no modifier is dropped', () => {
  expect(steps([entry, traceRecord({ at: 1, kind: 'key', block: 'search', key: 'a' })])).toEqual(
    []
  );
});

test('T17 a dropped single-character key still ends the segment when its event failed', () => {
  const { journey, footer, failure } = compile([
    entry,
    traceRecord({ at: 1, block: 'save' }),
    traceRecord({
      at: 2,
      kind: 'key',
      block: 'search',
      key: 'a',
      event: event({
        name: 'onKeyDown',
        block_id: 'search',
        success: false,
        error: { name: 'ActionError', config_key: 'k-key', action_type: 'SetState' },
      }),
    }),
    traceRecord({ at: 3, block: 'retry' }),
  ]);
  expect(journey.steps).toEqual([{ click: 'save' }]);
  expect(footer).toBe('failed here: ActionError in SetState (k-key)');
  expect(failure).toBe('tickets.search.onKeyDown');
});

test('T18 an event that called requests gives a wait for the last request, never wait ms', () => {
  expect(
    steps([
      entry,
      traceRecord({
        at: 1,
        block: 'save',
        event: event({
          requests: [
            { id: 'validate_ticket', ok: true, ms: 10 },
            { id: 'save_ticket', ok: true, ms: 80 },
          ],
        }),
      }),
    ])
  ).toEqual([{ click: 'save' }, { wait: { request: 'save_ticket' } }]);
});

test('T19 state writes give at most five expectations, leaf scalars first, removals and redacted out', () => {
  const result = steps([
    entry,
    traceRecord({
      at: 1,
      block: 'save',
      event: event({
        state_writes: [
          { path: 'rows', type: 'array', value: [1] },
          { path: 'a', type: 'string', value: 'a' },
          { path: 'secret', type: 'string', value: null, redacted: true },
          { path: 'b', type: 'number', value: 1 },
          { path: 'c', type: 'boolean', value: true },
          { path: 'd', type: 'null', value: null },
          { path: 'e', type: 'date', value: '2026-09-01T10:00:00.000Z' },
          { path: 'f', type: 'string', value: 'f' },
          { path: 'gone', type: 'undefined' },
        ],
      }),
    }),
  ]);
  expect(result.slice(1).map((step) => step.expect.state.path)).toEqual(['a', 'b', 'c', 'd', 'e']);
  expect(result[1]).toEqual({ expect: { state: { path: 'a', equals: 'a', from: 'recorded' } } });
});

test('T20 an event whose outcome was not observed gives the step with no wait or expect', () => {
  expect(
    steps([
      entry,
      traceRecord({
        at: 1,
        block: 'save',
        event: event({
          success: null,
          requests: [{ id: 'save_ticket' }],
          state_writes: [{ path: 'a', type: 'string', value: 'a' }],
        }),
      }),
    ])
  ).toEqual([{ click: 'save' }]);
});

test('T21 a failing interaction ends the segment at its step with a failed-here comment', () => {
  const { journey, comments, failure } = compile([
    entry,
    traceRecord({
      at: 1,
      block: 'save',
      event: event({
        success: false,
        error: { name: 'RequestError', config_key: 'k-save', action_type: 'Request' },
        requests: [{ id: 'save_ticket', ok: false }],
      }),
    }),
    traceRecord({ at: 5, block: 'retry' }),
  ]);
  expect(journey.steps).toEqual([{ click: 'save' }]);
  expect(comments.get(0)).toBe('failed here: RequestError in Request (k-save)');
  expect(failure).toBe('tickets.save.onClick');
});

test('T22 a failing Validate names the invalid blocks in its comment', () => {
  const { comments } = compile([
    entry,
    traceRecord({
      at: 1,
      block: 'assign',
      event: event({
        block_id: 'assign',
        success: false,
        error: { name: 'UserError', config_key: 'k-v', action_type: 'Validate' },
        invalid_blocks: ['assignee', 'due'],
      }),
    }),
  ]);
  expect(comments.get(0)).toBe(
    'failed here: UserError in Validate (k-v), invalid: [assignee, due]'
  );
});

test('T23 mount-class and app engine records give no step and no comment', () => {
  const { journey, comments, footer } = compile([
    entry,
    traceRecord({
      at: 0.1,
      kind: 'engine',
      event: event({ name: 'onMount', block_id: 'tickets' }),
    }),
    traceRecord({
      at: 0.2,
      kind: 'engine',
      scope: 'app',
      event: event({ name: 'onInit', block_id: 'app' }),
    }),
    traceRecord({ at: 1, block: 'save' }),
  ]);
  expect(journey.steps).toEqual([{ click: 'save' }]);
  expect(comments.size).toBe(0);
  expect(footer).toBeUndefined();
});

test('T24 a programmatic engine record gives a comment above the next step', () => {
  const { journey, comments } = compile([
    entry,
    traceRecord({ at: 1, block: 'save' }),
    traceRecord({
      at: 2,
      kind: 'engine',
      event: event({ name: 'onSelectionChange', block_id: 'grid' }),
    }),
    traceRecord({ at: 3, block: 'next' }),
  ]);
  expect(journey.steps).toEqual([{ click: 'save' }, { click: 'next' }]);
  expect(comments.get(1)).toBe(
    'onSelectionChange on "grid" ran with no interaction causing it; not a step.'
  );
});

test('T25 a failed engine record gives a comment and a failure without ending the segment', () => {
  const { journey, failure, comments } = compile([
    entry,
    traceRecord({
      at: 0.5,
      kind: 'engine',
      scope: 'app',
      event: event({
        name: 'onInit',
        block_id: 'app',
        success: false,
        error: { name: 'RequestError', config_key: 'k-init', action_type: 'Request' },
      }),
    }),
    traceRecord({ at: 1, block: 'save' }),
  ]);
  expect(journey.steps).toEqual([{ click: 'save' }]);
  expect(failure).toBe('app.onInit');
  expect(comments.get(0)).toBe(
    'onInit on "app" failed with no interaction causing it: RequestError in Request (k-init).'
  );
  const page = compile([
    entry,
    traceRecord({
      at: 0.5,
      kind: 'engine',
      event: event({ name: 'onMount', block_id: 'tickets', success: false }),
    }),
  ]);
  expect(page.failure).toBe('tickets.tickets.onMount');
});

test('T26 also adds no step, and a failure in also is the interaction failure', () => {
  const ok = compile([
    entry,
    traceRecord({
      at: 1,
      block: 'title_text',
      event: event({ block_id: 'title_text' }),
      also: [event({ block_id: 'card' })],
    }),
  ]);
  expect(ok.journey.steps).toEqual([{ click: 'title_text' }]);
  const failing = compile([
    entry,
    traceRecord({
      at: 1,
      block: 'title_text',
      event: event({ block_id: 'title_text' }),
      also: [
        event({ block_id: 'card', success: false, error: { name: 'Error', action_type: 'Link' } }),
      ],
    }),
    traceRecord({ at: 2, block: 'next' }),
  ]);
  expect(failing.journey.steps).toEqual([{ click: 'title_text' }]);
  expect(failing.failure).toBe('tickets.card.onClick');
});

test('a production click left with neither block nor text gives a comment and the unresolved-target flag', () => {
  // The label is not config text, and the control sits outside every block.
  const unlabelled = traceRecord({ at: 1, source: 'production', text: 'Settings' });
  unlabelled.target = { ...unlabelled.target, text: null };
  const { journey, footer, flags } = compile([prodEntry, unlabelled]);
  expect(journey.steps).toEqual([]);
  expect(footer).toBe(
    'click on a control known neither by block nor by kept text: write the step by hand'
  );
  expect(flags).toEqual(['unresolved-target']);
});

test('compileSegment writes user roles for dev and explorer sources only', () => {
  const records = [
    { ...entry, roles: ['member'] },
    { ...traceRecord({ at: 1, block: 'save' }), roles: ['member'] },
  ];
  expect(compile(records).journey.user).toEqual({ roles: ['member'] });
  expect(compile(records, { source: 'journey' }).journey.user).toBeUndefined();
});

test('compileSegment starts from the first record page when the segment has no entry pageview', () => {
  const { journey } = compile([traceRecord({ at: 0, block: 'save', page: 'orders' })]);
  expect(journey).toEqual({
    name: 'tickets recorded test',
    pageId: 'orders',
    steps: [{ click: 'save' }],
  });
});

test('compileSegment never emits goto, open, expect.dom, durationMsUnder or reject', () => {
  const { journey } = compile([
    entry,
    traceRecord({ at: 1, block: 'owner' }),
    traceRecord({ at: 2, block: 'owner', text: 'Grace', option: true }),
    traceRecord({ at: 3, kind: 'back' }),
    traceRecord({ at: 4, kind: 'pageview', url: '/home', page: 'home', caused: true }),
  ]);
  const verbs = journey.steps.flatMap((step) => [
    ...Object.keys(step),
    ...Object.keys(step.expect ?? {}),
  ]);
  ['goto', 'open', 'dom', 'durationMsUnder', 'reject'].forEach((verb) => {
    expect(verbs).not.toContain(verb);
  });
});

// The v8 compileEvent tests, ported to v1 records and v7 grammar.

test('a click record gives a click step', () => {
  expect(steps([entry, traceRecord({ at: 1, block: 'submit' })])).toEqual([{ click: 'submit' }]);
});

test('a change record gives a fill with the recorded value', () => {
  expect(
    steps([
      entry,
      traceRecord({
        at: 1,
        kind: 'change',
        block: 'search',
        blockType: 'TextInput',
        value: 'shoes',
      }),
    ])
  ).toEqual([{ fill: { blockId: 'search', value: 'shoes', from: 'recorded' } }]);
});

test('a production change gives a fill placeholder and no expect.state', () => {
  expect(
    steps([
      prodEntry,
      traceRecord({
        at: 1,
        kind: 'change',
        block: 'search',
        source: 'production',
        event: event({
          name: 'onChange',
          block_id: 'search',
          success: false,
          state_writes: [{ path: 'search', type: 'string' }],
        }),
      }),
    ])
  ).toEqual([{ fill: { blockId: 'search', value: null, from: 'shape' } }]);
});

test('a change on a date block gives the manual-input comment instead of a step', () => {
  const { journey, footer } = compile([
    entry,
    traceRecord({ at: 1, kind: 'change', block: 'due', blockType: 'DateSelector', value: 'x' }),
  ]);
  expect(journey.steps).toEqual([]);
  expect(footer).toContain('due (DateSelector): no v7 journey verb drives this input');
});

test('a key Enter after a fill gives press Enter', () => {
  expect(
    steps([
      entry,
      traceRecord({ at: 1, kind: 'change', block: 'search', value: 'shoes' }),
      traceRecord({ at: 2, kind: 'key', block: 'search', key: 'Enter' }),
    ])
  ).toEqual([
    { fill: { blockId: 'search', value: 'shoes', from: 'recorded' } },
    { press: 'Enter' },
  ]);
});

test('a key Escape gives press Escape', () => {
  expect(steps([entry, traceRecord({ at: 1, kind: 'key', key: 'Escape' })])).toEqual([
    { press: 'Escape' },
  ]);
});

test('a caused pageview after a link click gives an expect.url', () => {
  expect(
    steps([
      entry,
      traceRecord({
        at: 1,
        block: 'submit',
        event: event({ block_id: 'submit', url_after: '/orders/o-1?tab=items' }),
      }),
      traceRecord({
        at: 1.5,
        kind: 'pageview',
        page: 'orders',
        url: '/orders/o-1?tab=items',
        caused: true,
      }),
    ])
  ).toEqual([{ click: 'submit' }, { expect: { url: { contains: '/orders/o-1?tab=items' } } }]);
});

test('no expect.url when no pageview follows the click', () => {
  expect(
    steps([entry, traceRecord({ at: 1, block: 'submit', event: event({ block_id: 'submit' }) })])
  ).toEqual([{ click: 'submit' }]);
});

test('a block valueType comes from the block metas of the record block_type', () => {
  const { journey, flags } = compile([
    entry,
    traceRecord({ at: 1, kind: 'change', block: 'qty', blockType: 'NumberInput', value: 2 }),
    traceRecord({ at: 5, kind: 'change', block: 'unknown', value: 'x' }),
  ]);
  expect(journey.steps).toEqual([
    { fill: { blockId: 'qty', value: 2, from: 'recorded' } },
    { fill: { blockId: 'unknown', value: 'x', from: 'recorded' } },
  ]);
  expect(flags).toEqual([]);
});
