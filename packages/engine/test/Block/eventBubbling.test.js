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

// window.event is the DOM event being dispatched; the node test environment has no window.
function dispatch(domEvent, fn) {
  globalThis.window = { event: domEvent };
  try {
    return fn();
  } finally {
    delete globalThis.window;
  }
}

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

async function clickButtonThenCard(context, domEvent) {
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
  const [buttonResult, cardResult] = await Promise.all(
    await clickButtonThenCard(context, new Event('click'))
  );
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
  const [, cardResult] = await Promise.all(await clickButtonThenCard(context, new Event('click')));
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
    dispatch(new Event('click'), () => [
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
    dispatch(new Event('click'), () => [
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
  await Promise.all(await clickButtonThenCard(context, new Event('click')));
  await dispatch(new Event('click'), () => card.triggerEvent({ name: 'onClick' }));
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
  await dispatch(new Event('click'), () => button.triggerEvent({ name: 'onClick' }));
  expect((await changeResult).handledBy).toBeUndefined();
  expect(context.state).toEqual({ changed: true });
});
