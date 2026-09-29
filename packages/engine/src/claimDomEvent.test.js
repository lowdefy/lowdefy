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

import claimDomEvent from './claimDomEvent.js';
import exemptFromDomEvent from './exemptFromDomEvent.js';

// A DOM event whose path runs through the layout elements of these blocks, innermost first, as
// the client renders them (`bl-<blockId>`).
function createDomEvent(type, blockIds) {
  const elements = blockIds.map((blockId) => ({ id: `bl-${blockId}` }));
  const domEvent = new Event(type);
  domEvent.composedPath = () => [...elements, { id: 'root' }];
  return { domEvent, elements };
}

function dispatch({ domEvent, elements }, fn) {
  global.window = { event: domEvent };
  global.document = {
    getElementById: (id) => elements.find((element) => element.id === id) ?? null,
  };
  try {
    return fn();
  } finally {
    delete global.window;
    delete global.document;
  }
}

test('claimDomEvent lets the innermost block with actions handle a DOM event', () => {
  dispatch(createDomEvent('click', ['button', 'card']), () => {
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});

test('claimDomEvent never skips or claims for a block the DOM event did not pass through', () => {
  dispatch(createDomEvent('click', ['button', 'card']), () => {
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    // A table next to the button fires onSelectionChange from an effect React flushes inside the
    // click, after the button's CallMethod cleared its selection.
    expect(claimDomEvent({ blockId: 'table', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});

test('claimDomEvent lets an inner block run after an outer block handled the DOM event', () => {
  dispatch(createDomEvent('click', ['table', 'card', 'page']), () => {
    // A clickable card runs its onClick in the click, the table inside it fires
    // onSelectionChange for the checkbox from an effect afterwards.
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'table', bubble: false, hasActions: true })).toBeNull();
    // The innermost handler holds the claim for the blocks further out.
    expect(claimDomEvent({ blockId: 'page', bubble: false, hasActions: true })).toBe('table');
  });
});

test('claimDomEvent lets a block without actions or with bubble: true pass the DOM event on', () => {
  dispatch(createDomEvent('click', ['text', 'button', 'card']), () => {
    expect(claimDomEvent({ blockId: 'text', bubble: false, hasActions: false })).toBeNull();
    expect(claimDomEvent({ blockId: 'button', bubble: true, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBeNull();
  });
});

test('claimDomEvent never skips a block an action called a method on', () => {
  dispatch(createDomEvent('click', ['button', 'table', 'card']), () => {
    // A button in the table's bulk action slot runs CallMethod clearSelection on the table.
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    exemptFromDomEvent({ blockId: 'table' });
    expect(claimDomEvent({ blockId: 'table', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});

test('claimDomEvent never claims a DOM event that passed through no block', () => {
  // React's scheduler runs effects inside MessageChannel `message` events.
  dispatch(createDomEvent('message', []), () => {
    expect(claimDomEvent({ blockId: 'a', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'b', bubble: false, hasActions: true })).toBeNull();
  });
});

test('claimDomEvent never skips an internal event for a DOM event an inner block handled', () => {
  dispatch(createDomEvent('click', ['button', 'table', 'card']), () => {
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    expect(
      claimDomEvent({ blockId: 'table', bubble: false, hasActions: true, internal: true })
    ).toBeNull();
    // The internal event did not take the claim from the button.
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});

test('claimDomEvent lets an internal event claim an unclaimed DOM event', () => {
  dispatch(createDomEvent('click', ['header', 'box']), () => {
    expect(
      claimDomEvent({ blockId: 'header', bubble: false, hasActions: true, internal: true })
    ).toBeNull();
    expect(claimDomEvent({ blockId: 'box', bubble: false, hasActions: true })).toBe('header');
  });
});

test('claimDomEvent ignores events outside a DOM dispatch', () => {
  expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
  exemptFromDomEvent({ blockId: 'button' });
});
