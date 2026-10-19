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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId };

// window.event is the DOM event being dispatched; the node test environment has no window. Its path
// runs through the layout elements (`bl-<blockId>`) of these blocks, innermost first. fn may return
// a promise: window.event stays the DOM event until it settles, as it does for the microtasks
// (React's flush of effects) that run inside a DOM event listener.
function dispatch({ type, path }, fn) {
  const elements = path.map((blockId) => ({ id: `bl-${blockId}` }));
  const domEvent = type === 'message' ? new MessageEvent('message') : new Event(type);
  domEvent.composedPath = () => [...elements, { id: 'root' }];
  global.window = { event: domEvent };
  global.document = {
    getElementById: (id) => elements.find((element) => element.id === id) ?? null,
  };
  function cleanUp() {
    delete global.window;
    delete global.document;
  }
  let result;
  try {
    result = fn();
  } catch (error) {
    cleanUp();
    throw error;
  }
  if (result instanceof Promise) return result.finally(cleanUp);
  cleanUp();
  return result;
}

const buttonClick = { type: 'click', path: ['button', 'card', 'root'] };

function setStateAction(id, params) {
  return { id, type: 'SetState', params };
}

function pageConfig({ buttonEvent }) {
  return {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'card',
        type: 'Box',
        events: {
          onClick: [setStateAction('card_clicked', { card: true })],
        },
        blocks: [
          {
            id: 'button',
            type: 'Button',
            events: buttonEvent ? { onClick: buttonEvent } : {},
          },
          {
            id: 'text',
            type: 'Paragraph',
          },
        ],
      },
    ],
  };
}

async function clickButtonThenCard(context, domEvent = buttonClick) {
  const { button, card } = context._internal.RootSlots.map;
  return dispatch(domEvent, () => [
    button.triggerEvent({ name: 'onClick' }),
    card.triggerEvent({ name: 'onClick' }),
  ]);
}

test('a DOM event handled by a block does not trigger events of the blocks around it', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({ buttonEvent: [setStateAction('button_clicked', { button: true })] }),
  });
  const [buttonResult, cardResult] = await Promise.all(await clickButtonThenCard(context));
  expect(buttonResult.success).toBe(true);
  expect(cardResult.handledBy).toBe('button');
  expect(context.state).toEqual({ button: true });
});

test('bubble: true on the handling event lets the DOM event trigger the blocks around it', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({
      buttonEvent: { bubble: true, try: [setStateAction('button_clicked', { button: true })] },
    }),
  });
  const [, cardResult] = await Promise.all(await clickButtonThenCard(context));
  expect(cardResult.handledBy).toBeUndefined();
  expect(context.state).toEqual({ button: true, card: true });
});

test('a block without the event lets the DOM event reach the blocks around it', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({ buttonEvent: undefined }),
  });
  const { text, card } = context._internal.RootSlots.map;
  await Promise.all(
    dispatch({ type: 'click', path: ['text', 'card', 'root'] }, () => [
      text.triggerEvent({ name: 'onClick' }),
      card.triggerEvent({ name: 'onClick' }),
    ])
  );
  expect(context.state).toEqual({ card: true });
});

test('a block can fire several events for the same DOM event', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: {
      id: 'root',
      type: 'Box',
      blocks: [
        {
          id: 'grid',
          type: 'Box',
          events: {
            onCellClick: [setStateAction('cell', { cell: true })],
            onRowClick: [setStateAction('row', { row: true })],
          },
        },
      ],
    },
  });
  const { grid } = context._internal.RootSlots.map;
  await Promise.all(
    dispatch({ type: 'click', path: ['grid', 'root'] }, () => [
      grid.triggerEvent({ name: 'onCellClick' }),
      grid.triggerEvent({ name: 'onRowClick' }),
    ])
  );
  expect(context.state).toEqual({ cell: true, row: true });
});

test('a new DOM event is handled independently of the previous one', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({ buttonEvent: [setStateAction('button_clicked', { button: true })] }),
  });
  const { card } = context._internal.RootSlots.map;
  await Promise.all(await clickButtonThenCard(context));
  await dispatch({ type: 'click', path: ['card', 'root'] }, () =>
    card.triggerEvent({ name: 'onClick' })
  );
  expect(context.state).toEqual({ button: true, card: true });
});

test('events triggered outside a DOM event dispatch are never skipped', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({ buttonEvent: [setStateAction('button_clicked', { button: true })] }),
  });
  const { button, card } = context._internal.RootSlots.map;
  await button.triggerEvent({ name: 'onClick' });
  await card.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ button: true, card: true });
});

test('an event a block fires from an action run by the handling event is not skipped', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: {
      id: 'root',
      type: 'Box',
      blocks: [
        {
          id: 'button',
          type: 'Button',
          events: {
            onClick: [
              {
                id: 'collapse',
                type: 'CallMethod',
                params: { blockId: 'table', method: 'collapse' },
              },
            ],
          },
        },
        {
          id: 'table',
          type: 'Box',
          events: {
            onChange: [setStateAction('table_changed', { changed: true })],
          },
        },
      ],
    },
  });
  const { button, table } = context._internal.RootSlots.map;
  let changeResult;
  // The method fires the block's own event while the button's click is still being dispatched,
  // as a block does when a method changes its value.
  table.registerMethod('collapse', () => {
    changeResult = table.triggerEvent({ name: 'onChange' });
  });
  await dispatch({ type: 'click', path: ['button', 'root'] }, () =>
    button.triggerEvent({ name: 'onClick' })
  );
  expect((await changeResult).handledBy).toBeUndefined();
  expect(context.state).toEqual({ changed: true });
});

test('events fired while a scheduler message is dispatched are never claimed', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({ buttonEvent: [setStateAction('button_clicked', { button: true })] }),
  });
  const [, cardResult] = await Promise.all(
    await clickButtonThenCard(context, { type: 'message', path: [] })
  );
  expect(cardResult.handledBy).toBeUndefined();
  expect(context.state).toEqual({ button: true, card: true });
});

function tablePageConfig({ buttonActions, tableInCard = false }) {
  const table = {
    id: 'table',
    type: 'Box',
    events: {
      onSelectionChange: [setStateAction('table_selection', { selectionChanged: true })],
    },
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: { onClick: buttonActions },
      },
    ],
  };
  return {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'card',
        type: 'Box',
        events: { onClick: [setStateAction('card_clicked', { card: true })] },
        blocks: tableInCard ? [table] : [],
      },
      ...(tableInCard ? [] : [table]),
      {
        id: 'outside_button',
        type: 'Button',
        events: { onClick: buttonActions },
      },
    ],
  };
}

test('an effect-fired event of a block the DOM event did not pass through runs', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: tablePageConfig({
      buttonActions: [setStateAction('button_clicked', { button: true })],
    }),
  });
  const { outside_button: outsideButton, table } = context._internal.RootSlots.map;
  // The table reacts to the state the button set from an effect, which React flushes in a
  // microtask while window.event is still the click.
  const selectionResult = await dispatch(
    { type: 'click', path: ['outside_button', 'root'] },
    async () => {
      await outsideButton.triggerEvent({ name: 'onClick' });
      return table.triggerEvent({ name: 'onSelectionChange' });
    }
  );
  expect(selectionResult.handledBy).toBeUndefined();
  expect(context.state).toEqual({ button: true, selectionChanged: true });
});

test('a block on the path is still skipped after the handling event actions ran', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: pageConfig({ buttonEvent: [setStateAction('button_clicked', { button: true })] }),
  });
  const { button, card } = context._internal.RootSlots.map;
  const cardResult = await dispatch(buttonClick, async () => {
    await button.triggerEvent({ name: 'onClick' });
    return card.triggerEvent({ name: 'onClick' });
  });
  expect(cardResult.handledBy).toBe('button');
  expect(context.state).toEqual({ button: true });
});

test('a block inside the block that handled the DOM event still runs its events', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: tablePageConfig({ buttonActions: [], tableInCard: true }),
  });
  const { card, table } = context._internal.RootSlots.map;
  // A checkbox click in a table inside a clickable card: the card's onClick runs in the click,
  // the table's onSelectionChange from an effect after it.
  const selectionResult = await dispatch({ type: 'click', path: ['table', 'card', 'root'] }, () => {
    card.triggerEvent({ name: 'onClick' });
    return table.triggerEvent({ name: 'onSelectionChange' });
  });
  expect(selectionResult.handledBy).toBeUndefined();
  expect(context.state).toEqual({ card: true, selectionChanged: true });
});

test('an effect-fired event of a block an action called a method on runs', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: tablePageConfig({
      buttonActions: [
        {
          id: 'clear',
          type: 'CallMethod',
          params: { blockId: 'table', method: 'clearSelection' },
        },
      ],
    }),
  });
  const { button, table } = context._internal.RootSlots.map;
  let selectionResult;
  // The button sits in the table's slot, so the click passes through the table too. The table
  // fires onSelectionChange from the effect that commits the cleared selection.
  table.registerMethod('clearSelection', () => {
    selectionResult = Promise.resolve().then(() =>
      table.triggerEvent({ name: 'onSelectionChange' })
    );
  });
  await dispatch({ type: 'click', path: ['button', 'table', 'root'] }, async () => {
    await button.triggerEvent({ name: 'onClick' });
    await selectionResult;
  });
  expect((await selectionResult).handledBy).toBeUndefined();
  expect(context.state).toEqual({ selectionChanged: true });
});

test('an internal event runs for a DOM event an inner block handled', async () => {
  const context = await testContext({
    lowdefy,
    pageConfig: tablePageConfig({
      buttonActions: [setStateAction('button_clicked', { button: true })],
    }),
  });
  const { button, table } = context._internal.RootSlots.map;
  table.registerEvent({
    name: '__tableFetch',
    actions: [setStateAction('fetch', { fetched: true })],
  });
  const fetchResult = await dispatch(
    { type: 'click', path: ['button', 'table', 'root'] },
    async () => {
      await button.triggerEvent({ name: 'onClick' });
      return table.triggerEvent({ name: '__tableFetch' });
    }
  );
  expect(fetchResult.handledBy).toBeUndefined();
  expect(context.state).toEqual({ button: true, fetched: true });
});
