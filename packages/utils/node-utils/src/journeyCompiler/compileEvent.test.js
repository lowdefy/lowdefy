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

import compileEvent from './compileEvent.js';
import parseTraceEvent from './parseTraceEvent.js';
import resolveValueType from './resolveValueType.js';
import { blockMetas, blockTypes } from './testTrace.js';

function compile(row) {
  return compileEvent({
    blockMetas,
    blockTypes,
    event: parseTraceEvent({
      page_id: 'orders',
      session_id: 's',
      ...row,
    }),
  });
}

test('compileEvent maps onClick to a click step', () => {
  expect(compile({ block_id: 'submit', event_name: 'onClick' }).steps).toEqual([
    { click: 'submit' },
  ]);
});

test('compileEvent maps onChange on a block with a valueType to a set step with the recorded value', () => {
  const { steps } = compile({
    block_id: 'search',
    event_name: 'onChange',
    state_writes: [{ path: 'search', type: 'string', value: 'shoes' }],
  });
  expect(steps[0]).toEqual({ set: { blockId: 'search', value: 'shoes' } });
});

test('compileEvent maps onChange in a prod trace to a set with a null value marked recorded-shape', () => {
  const { steps } = compile({
    block_id: 'search',
    event_name: 'onChange',
    state_writes: [{ path: 'search', type: 'string' }],
  });
  expect(steps[0]).toEqual({ set: { blockId: 'search', from: 'recorded-shape', value: null } });
  expect(steps[1]).toEqual({ expect: { state: { path: 'search' } } });
});

test('compileEvent skips onChange on a block that has no valueType', () => {
  const { skipped, steps } = compile({ block_id: 'label', event_name: 'onChange' });
  expect(steps).toEqual([]);
  expect(skipped).toBe(
    'onChange on "label" is not a step: the block has no valueType, so there is no value to set.'
  );
});

test('compileEvent maps onEnter to a press of Enter on the block', () => {
  expect(compile({ block_id: 'search', event_name: 'onEnter' }).steps).toEqual([
    { press: { blockId: 'search', key: 'Enter' } },
  ]);
});

test('compileEvent maps onKeyDown with a key to a press of that key', () => {
  expect(
    compile({ block_id: 'search', event_name: 'onKeyDown', payload: { key: 'Escape' } }).steps
  ).toEqual([{ press: { blockId: 'search', key: 'Escape' } }]);
});

test('compileEvent skips onKeyDown when the trace records no key', () => {
  const { skipped, steps } = compile({ block_id: 'search', event_name: 'onKeyDown' });
  expect(steps).toEqual([]);
  expect(skipped).toBe('onKeyDown on "search" is not a step: the trace records no key.');
});

test('compileEvent adds a url expectation after a Link action that succeeded', () => {
  const { steps } = compile({
    block_id: 'submit',
    event_name: 'onClick',
    actions: [{ id: 'a', outcome: 'ok', type: 'Link' }],
    url_after: 'https://app.example.com/orders/o-1?tab=items',
  });
  expect(steps).toEqual([
    { click: 'submit' },
    { expect: { url: { contains: '/orders/o-1?tab=items' } } },
  ]);
});

test('compileEvent adds no url expectation for a Link action that did not succeed', () => {
  const { steps } = compile({
    block_id: 'submit',
    event_name: 'onClick',
    actions: [{ id: 'a', outcome: 'skipped', type: 'Link' }],
    url_after: 'https://app.example.com/orders/o-1',
  });
  expect(steps).toEqual([{ click: 'submit' }]);
});

test('compileEvent emits no step and a named comment for an event no interaction reaches', () => {
  const { skipped, steps } = compile({ block_id: 'page', event_name: 'onMount' });
  expect(steps).toEqual([]);
  expect(skipped).toBe('onMount on "page" is not a step: no interaction reaches it.');
});

test('compileEvent writes leaf scalars first and at most five state expectations', () => {
  const { steps } = compile({
    block_id: 'submit',
    event_name: 'onClick',
    state_writes: [
      { path: 'rows', type: 'array', value: [1] },
      { path: 'a', type: 'string', value: 'a' },
      { path: 'b', type: 'number', value: 1 },
      { path: 'c', type: 'boolean', value: true },
      { path: 'd', type: 'null', value: null },
      { path: 'e', type: 'date', value: '2026-09-01T10:00:00.000Z' },
      { path: 'f', type: 'string', value: 'f' },
      { path: 'gone', type: 'undefined' },
    ],
  });
  expect(steps.slice(1).map((step) => step.expect.state.path)).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('resolveValueType prefers the block type on the trace over the build map', () => {
  const event = parseTraceEvent({
    block_id: 'qty',
    block_type: 'TextInput',
    event_name: 'onChange',
    page_id: 'orders',
    session_id: 's',
  });
  expect(resolveValueType({ blockMetas, blockTypes, event })).toBe('string');
});
