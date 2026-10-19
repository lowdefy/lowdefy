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

import isMountEventName from './isMountEventName.js';
import pairTraceEvents from './pairTraceEvents.js';

const T0 = 1_700_000_000_000;

function event({ id, blockId, eventName = 'onClick', at, debounceMs = 0, scope = 'page' }) {
  return { id, blockId, eventName, startTimestamp: T0 + at, debounceMs, scope };
}

test('pairTraceEvents pairs a debounced onChange with the last keystroke only', () => {
  const blockIds = ['search', 'page'];
  const interactions = [
    { id: 'k1', t: T0, blockIds },
    { id: 'k2', t: T0 + 150, blockIds },
    { id: 'k3', t: T0 + 300, blockIds },
  ];
  const events = [
    event({ id: 'e1', blockId: 'search', eventName: 'onChange', at: 800, debounceMs: 500 }),
  ];
  expect(pairTraceEvents({ interactions, events })).toEqual({
    pairs: [{ interactionId: 'k3', eventIds: ['e1'] }],
    unpaired: [],
  });
});

test('pairTraceEvents puts the inner event first when an event bubbles to an outer block', () => {
  const interactions = [{ id: 'c1', t: T0, blockIds: ['button', 'card', 'page'] }];
  const events = [
    event({ id: 'outer', blockId: 'card', at: 10 }),
    event({ id: 'inner', blockId: 'button', at: 20 }),
  ];
  expect(pairTraceEvents({ interactions, events }).pairs).toEqual([
    { interactionId: 'c1', eventIds: ['inner', 'outer'] },
  ]);
});

test('pairTraceEvents orders two events on the same block earliest first', () => {
  const interactions = [{ id: 'c1', t: T0, blockIds: ['grid', 'page'] }];
  const events = [
    event({ id: 'late', blockId: 'grid', eventName: 'onRowClick', at: 30 }),
    event({ id: 'early', blockId: 'grid', eventName: 'onCellClick', at: 10 }),
  ];
  expect(pairTraceEvents({ interactions, events }).pairs[0].eventIds).toEqual(['early', 'late']);
});

test('pairTraceEvents never pairs a mount-time request or an app onInit', () => {
  const interactions = [{ id: 'c1', t: T0, blockIds: ['page'] }];
  const events = [
    event({ id: 'mount', blockId: 'page', eventName: 'onMount', at: 5 }),
    event({ id: 'mountAsync', blockId: 'page', eventName: 'onMountAsync', at: 5 }),
    event({ id: 'init', blockId: 'page', eventName: 'onInit', at: 5, scope: 'app' }),
    event({ id: 'appClick', blockId: 'page', eventName: 'onClick', at: 5, scope: 'app' }),
  ];
  expect(pairTraceEvents({ interactions, events })).toEqual({
    pairs: [],
    unpaired: ['mount', 'mountAsync', 'init', 'appClick'],
  });
});

test('pairTraceEvents leaves an off-path event unpaired', () => {
  // A Table beside the Button fires onSelectionChange while the Button's click
  // is still the current DOM event; the Table does not enclose the Button.
  const interactions = [{ id: 'c1', t: T0, blockIds: ['save_button', 'page'] }];
  const events = [
    event({ id: 'sel', blockId: 'orders_table', eventName: 'onSelectionChange', at: 5 }),
  ];
  expect(pairTraceEvents({ interactions, events })).toEqual({ pairs: [], unpaired: ['sel'] });
});

test('pairTraceEvents pairs a click on a Title inside a clickable Card with the Card onClick', () => {
  const interactions = [{ id: 'c1', t: T0, blockIds: ['card_title', 'card', 'page'] }];
  const events = [event({ id: 'cardClick', blockId: 'card', at: 15 })];
  expect(pairTraceEvents({ interactions, events }).pairs).toEqual([
    { interactionId: 'c1', eventIds: ['cardClick'] },
  ]);
});

test('pairTraceEvents gives no event to an interaction whose event falls outside the window', () => {
  const interactions = [
    { id: 'c1', t: T0, blockIds: ['save', 'page'] },
    { id: 'c2', t: T0 + 5000, blockIds: ['other', 'page'] },
  ];
  const events = [event({ id: 'late', blockId: 'save', at: 3000 })];
  expect(pairTraceEvents({ interactions, events })).toEqual({ pairs: [], unpaired: ['late'] });
});

test('pairTraceEvents pairs an event exactly at debounceMs plus 1000 and not one later', () => {
  const interactions = [{ id: 'c1', t: T0, blockIds: ['search'] }];
  const atEdge = pairTraceEvents({
    interactions,
    events: [event({ id: 'e', blockId: 'search', at: 1300, debounceMs: 300 })],
  });
  const pastEdge = pairTraceEvents({
    interactions,
    events: [event({ id: 'e', blockId: 'search', at: 1301, debounceMs: 300 })],
  });
  expect(atEdge.pairs).toEqual([{ interactionId: 'c1', eventIds: ['e'] }]);
  expect(pastEdge).toEqual({ pairs: [], unpaired: ['e'] });
});

test('pairTraceEvents never pairs an event with an interaction that came after it', () => {
  const interactions = [{ id: 'c1', t: T0 + 100, blockIds: ['save'] }];
  const events = [event({ id: 'e', blockId: 'save', at: 50 })];
  expect(pairTraceEvents({ interactions, events }).unpaired).toEqual(['e']);
});

test('pairTraceEvents pairs a production failure with the click whose blockIds hold an ancestor of its block', () => {
  // A $autocapture click with lowdefy_block_ids, and a lowdefy_event_failed
  // event mapped to the inputs: its timestamp is the start time.
  const autocapture = {
    uuid: 'ac-1',
    timestamp: '2026-09-28T14:03:11.204Z',
    properties: { lowdefy_block_ids: ['assign_label', 'assign_form', 'page'] },
  };
  const failed = {
    uuid: 'ef-1',
    timestamp: '2026-09-28T14:03:11.420Z',
    properties: {
      lowdefy_block_id: 'assign_form',
      lowdefy_event_name: 'onSubmit',
      lowdefy_debounce_ms: null,
      lowdefy_event_scope: 'page',
    },
  };
  const result = pairTraceEvents({
    interactions: [
      {
        id: autocapture.uuid,
        t: Date.parse(autocapture.timestamp),
        blockIds: autocapture.properties.lowdefy_block_ids,
      },
    ],
    events: [
      {
        id: failed.uuid,
        blockId: failed.properties.lowdefy_block_id,
        eventName: failed.properties.lowdefy_event_name,
        startTimestamp: Date.parse(failed.timestamp),
        debounceMs: failed.properties.lowdefy_debounce_ms,
        scope: failed.properties.lowdefy_event_scope,
      },
    ],
  });
  expect(result).toEqual({ pairs: [{ interactionId: 'ac-1', eventIds: ['ef-1'] }], unpaired: [] });
});

test('isMountEventName is true for the four mount-class names and false for onClick', () => {
  ['onInit', 'onInitAsync', 'onMount', 'onMountAsync'].forEach((eventName) => {
    expect(isMountEventName({ eventName })).toBe(true);
  });
  expect(isMountEventName({ eventName: 'onClick' })).toBe(false);
  expect(isMountEventName({ eventName: 'onMountains' })).toBe(false);
});
