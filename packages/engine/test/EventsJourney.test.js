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

import { jest } from '@jest/globals';

import testContext from './testContext.js';

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('triggerEvent calls recordJourneyEvent once with the event record and the pre-event state', async () => {
  const recordJourneyEvent = jest.fn();
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
        },
      },
    ],
  };
  const context = await testContext({ lowdefy: { recordJourneyEvent }, pageConfig });
  const { button } = context._internal.RootSlots.map;
  await button.triggerEvent({ name: 'onClick' });

  expect(recordJourneyEvent).toHaveBeenCalledTimes(1);
  const [{ actions, context: recordedContext, record, stateBefore }] =
    recordJourneyEvent.mock.calls[0];
  expect(actions).toEqual([{ id: 'a', type: 'SetState', params: { a: 'a' } }]);
  expect(recordedContext).toBe(context);
  expect(record.blockId).toBe('button');
  expect(record.eventName).toBe('onClick');
  expect(record.success).toBe(true);
  expect(stateBefore).toEqual({});
  expect(context.state).toEqual({ a: 'a' });
});

test('triggerEvent hands catch actions to recordJourneyEvent alongside the try actions', async () => {
  const recordJourneyEvent = jest.fn();
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: {
            try: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
            catch: [{ id: 'b', type: 'SetState', params: { b: 'b' } }],
          },
        },
      },
    ],
  };
  const context = await testContext({ lowdefy: { recordJourneyEvent }, pageConfig });
  await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });

  expect(recordJourneyEvent.mock.calls[0][0].actions.map(({ id }) => id)).toEqual(['a', 'b']);
});

test('triggerEvent does not record a bounced event', async () => {
  const recordJourneyEvent = jest.fn();
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: {
            debounce: { ms: 40, immediate: true },
            try: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
          },
        },
      },
    ],
  };
  const context = await testContext({ lowdefy: { recordJourneyEvent }, pageConfig });
  const { button } = context._internal.RootSlots.map;

  await button.triggerEvent({ name: 'onClick' });
  const bounced = await button.triggerEvent({ name: 'onClick' });

  expect(bounced.bounced).toBe(true);
  expect(context.eventLog.length).toBe(2);
  expect(recordJourneyEvent).toHaveBeenCalledTimes(1);
  await timeout(60);
});

test('triggerEvent hands the async flag through, so the recorder can call an unresolved action pending', async () => {
  const recordJourneyEvent = jest.fn();
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            { id: 'a', type: 'SetState', params: { a: 'a' }, async: true },
            { id: 'b', type: 'SetState', params: { b: 'b' } },
          ],
        },
      },
    ],
  };
  const context = await testContext({ lowdefy: { recordJourneyEvent }, pageConfig });
  await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });

  const { actions, record } = recordJourneyEvent.mock.calls[0][0];
  // An 'async: true' action is fire-and-forget: its responses entry appears
  // whenever it resolves, which may be after the record is built. The flag is
  // what lets the recorder tell "not run" from "not finished".
  expect(actions.find(({ id }) => id === 'a').async).toBe(true);
  expect(record.responses.b).toBeDefined();
});

test('triggerEvent does not snapshot state when no journey recorder is registered', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
        },
      },
    ],
  };
  const context = await testContext({ lowdefy: {}, pageConfig });
  await expect(
    context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' })
  ).resolves.toMatchObject({ success: true });
});
