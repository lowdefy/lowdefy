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
import { serializer } from '@lowdefy/helpers';

import WebSockets from './WebSockets.js';

const initialChannelState = {
  connected: false,
  error: null,
  lastMessage: null,
  messageCount: 0,
  messages: [],
};

function createTestContext({ subscriptions = [] } = {}) {
  const client = {
    subscribe: jest.fn(async () => {}),
    unsubscribe: jest.fn(),
    publish: jest.fn(async () => {}),
  };
  const context = {
    eventLog: [],
    _internal: {
      Actions: {
        callActions: jest.fn(async ({ eventName }) => ({ eventName, success: true })),
      },
      lowdefy: {
        _internal: {
          websocketClient: client,
          handleError: jest.fn(),
        },
      },
      parser: {
        parse: jest.fn(() => ({ output: {}, errors: [] })),
      },
      rootBlock: { subscriptions },
      update: jest.fn(),
    },
  };
  return { client, context };
}

function subscribeHandlers(client, callIndex = 0) {
  return client.subscribe.mock.calls[callIndex][0].handlers;
}

// Node's global performance object is not configurable, so it cannot be faked.
function useFakeTimers() {
  jest.useFakeTimers({ doNotFake: ['performance'] });
}

afterEach(() => {
  jest.useRealTimers();
});

test('constructor initializes context.websockets channel state from rootBlock subscriptions', () => {
  const { context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }, { websocketId: 'chat' }],
  });
  // eslint-disable-next-line no-new
  new WebSockets(context);

  expect(context.websockets).toEqual({
    ticker: initialChannelState,
    chat: initialChannelState,
  });
});

test('subscribeAll subscribes each configured subscription', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }, { websocketId: 'chat' }],
  });
  const websockets = new WebSockets(context);

  websockets.subscribeAll();
  await Promise.resolve();

  expect(client.subscribe).toHaveBeenCalledTimes(2);
  const ids = client.subscribe.mock.calls.map(([call]) => call.websocketId);
  expect(ids).toEqual(['ticker', 'chat']);
});

test('subscribeAll reports subscribe failures through lowdefy handleError', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }],
  });
  const error = new Error('connect failed');
  client.subscribe.mockRejectedValue(error);
  const websockets = new WebSockets(context);

  websockets.subscribeAll();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  // The transport failure is wrapped as a ServiceError before it reaches handleError.
  expect(context._internal.lowdefy._internal.handleError).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'ServiceError', service: 'WebSocket', cause: error })
  );
});

test('subscribe evaluates the payload with the parser and passes the serialized payload to the client', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker', payload: { room: { _state: 'room' } } }],
  });
  context._internal.parser.parse.mockReturnValue({
    output: { room: 7, at: new Date(1000) },
    errors: [],
  });
  const websockets = new WebSockets(context);

  await websockets.subscribe({ websocketId: 'ticker' });

  expect(context._internal.parser.parse).toHaveBeenCalledWith({
    actions: undefined,
    arrayIndices: undefined,
    event: undefined,
    input: { room: { _state: 'room' } },
    location: 'subscription:ticker',
  });
  expect(client.subscribe.mock.calls[0][0].websocketId).toBe('ticker');
  expect(client.subscribe.mock.calls[0][0].payload).toEqual({ room: 7, at: { '~d': 1000 } });
});

test('duplicate subscribe to an active websocketId is a no-op', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }],
  });
  const websockets = new WebSockets(context);

  await websockets.subscribe({ websocketId: 'ticker' });
  await websockets.subscribe({ websocketId: 'ticker' });

  expect(client.subscribe).toHaveBeenCalledTimes(1);
});

test('subscribe with non-string websocketId throws', async () => {
  const { context } = createTestContext();
  const websockets = new WebSockets(context);

  await expect(websockets.subscribe({ websocketId: undefined })).rejects.toThrow(
    'Subscribe requires a websocketId.'
  );
  await expect(websockets.subscribe({ websocketId: { id: 'ticker' } })).rejects.toThrow(
    'Subscribe requires a websocketId.'
  );
});

test('parser errors reject subscribe before the client is called', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker', payload: { bad: { _state: null } } }],
  });
  context._internal.parser.parse.mockReturnValue({
    output: {},
    errors: [new Error('payload parse failed')],
  });
  const websockets = new WebSockets(context);

  await expect(websockets.subscribe({ websocketId: 'ticker' })).rejects.toThrow(
    'payload parse failed'
  );
  expect(client.subscribe).not.toHaveBeenCalled();
});

test('client subscribe rejection clears active state and records the channel error', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }],
  });
  client.subscribe.mockRejectedValue(new Error('connect failed'));
  const websockets = new WebSockets(context);

  await expect(websockets.subscribe({ websocketId: 'ticker' })).rejects.toThrow('connect failed');

  expect(context.websockets.ticker.error).toEqual({ message: 'connect failed' });
  // A failed subscribe can be retried.
  client.subscribe.mockResolvedValue(undefined);
  await websockets.subscribe({ websocketId: 'ticker' });
  expect(client.subscribe).toHaveBeenCalledTimes(2);
});

test('onConnected handler sets connected true and fires the onSubscribe event', async () => {
  const { client, context } = createTestContext({
    subscriptions: [
      {
        websocketId: 'ticker',
        events: { onSubscribe: [{ id: 'a', type: 'SetState' }] },
      },
    ],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });

  subscribeHandlers(client).onConnected();

  expect(context.websockets.ticker.connected).toBe(true);
  expect(context.websockets.ticker.error).toBe(null);
  expect(context._internal.update).toHaveBeenCalled();
  expect(context._internal.Actions.callActions).toHaveBeenCalledTimes(1);
  expect(context._internal.Actions.callActions.mock.calls[0][0].eventName).toBe('onSubscribe');
  expect(context._internal.Actions.callActions.mock.calls[0][0].actions).toEqual([
    { id: 'a', type: 'SetState' },
  ]);
});

test('onDisconnected handler sets connected false', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });

  subscribeHandlers(client).onConnected();
  expect(context.websockets.ticker.connected).toBe(true);
  subscribeHandlers(client).onDisconnected();

  expect(context.websockets.ticker.connected).toBe(false);
});

test('onError handler records the channel error and fires the onError event', async () => {
  const { client, context } = createTestContext({
    subscriptions: [
      {
        websocketId: 'ticker',
        events: { onError: [{ id: 'a', type: 'DisplayMessage' }] },
      },
    ],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });

  subscribeHandlers(client).onError('source failed');

  expect(context.websockets.ticker.error).toEqual({ message: 'source failed' });
  expect(context._internal.Actions.callActions).toHaveBeenCalledTimes(1);
  expect(context._internal.Actions.callActions.mock.calls[0][0].eventName).toBe('onError');
  expect(context._internal.Actions.callActions.mock.calls[0][0].event).toEqual({
    message: 'source failed',
  });
});

test('first message flushes immediately and later messages batch until the throttle window closes', async () => {
  useFakeTimers();
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker', client: { throttleRender: 250 } }],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });
  const { onMessage } = subscribeHandlers(client);

  onMessage(serializer.serialize({ data: { tick: 1 } }));

  // Leading edge: the first message renders without waiting for the timer.
  expect(context.websockets.ticker.messages).toEqual([{ tick: 1 }]);
  expect(context.websockets.ticker.lastMessage).toEqual({ tick: 1 });
  expect(context.websockets.ticker.messageCount).toBe(1);

  onMessage(serializer.serialize({ data: { tick: 2 } }));
  onMessage(serializer.serialize({ data: { tick: 3 } }));

  // Still inside the throttle window — nothing flushed yet.
  expect(context.websockets.ticker.messages).toEqual([{ tick: 1 }]);
  expect(context.websockets.ticker.messageCount).toBe(1);

  jest.advanceTimersByTime(250);

  expect(context.websockets.ticker.messages).toEqual([{ tick: 1 }, { tick: 2 }, { tick: 3 }]);
  expect(context.websockets.ticker.lastMessage).toEqual({ tick: 3 });
  expect(context.websockets.ticker.messageCount).toBe(3);
});

test('messages are capped by maxMessages while messageCount keeps counting', async () => {
  useFakeTimers();
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker', client: { maxMessages: 2, throttleRender: 250 } }],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });
  const { onMessage } = subscribeHandlers(client);

  onMessage(serializer.serialize({ data: { tick: 1 } }));
  onMessage(serializer.serialize({ data: { tick: 2 } }));
  onMessage(serializer.serialize({ data: { tick: 3 } }));
  jest.advanceTimersByTime(250);

  expect(context.websockets.ticker.messages).toEqual([{ tick: 2 }, { tick: 3 }]);
  expect(context.websockets.ticker.lastMessage).toEqual({ tick: 3 });
  expect(context.websockets.ticker.messageCount).toBe(3);
});

test('onMessage event fires with the flushed batch in event.messages', async () => {
  useFakeTimers();
  const { client, context } = createTestContext({
    subscriptions: [
      {
        websocketId: 'ticker',
        client: { throttleRender: 250 },
        events: { onMessage: [{ id: 'a', type: 'SetState' }] },
      },
    ],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });
  const { onMessage } = subscribeHandlers(client);

  onMessage(serializer.serialize({ data: { tick: 1 } }));
  onMessage(serializer.serialize({ data: { tick: 2 } }));
  onMessage(serializer.serialize({ data: { tick: 3 } }));
  jest.advanceTimersByTime(250);

  const events = context._internal.Actions.callActions.mock.calls.map(([call]) => ({
    eventName: call.eventName,
    event: call.event,
  }));
  expect(events).toEqual([
    { eventName: 'onMessage', event: { messages: [{ tick: 1 }] } },
    { eventName: 'onMessage', event: { messages: [{ tick: 2 }, { tick: 3 }] } },
  ]);
});

test('throttleRender below the minimum is clamped to 100ms', async () => {
  useFakeTimers();
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker', client: { throttleRender: 10 } }],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });
  const { onMessage } = subscribeHandlers(client);

  onMessage(serializer.serialize({ data: { tick: 1 } }));
  onMessage(serializer.serialize({ data: { tick: 2 } }));

  jest.advanceTimersByTime(99);
  expect(context.websockets.ticker.messages).toEqual([{ tick: 1 }]);
  jest.advanceTimersByTime(1);
  expect(context.websockets.ticker.messages).toEqual([{ tick: 1 }, { tick: 2 }]);
});

test('unsubscribe resets channel state, clears the flush timer and calls client unsubscribe', async () => {
  useFakeTimers();
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });
  const { onMessage } = subscribeHandlers(client);
  subscribeHandlers(client).onConnected();
  onMessage(serializer.serialize({ data: { tick: 1 } }));
  onMessage(serializer.serialize({ data: { tick: 2 } }));

  websockets.unsubscribe({ websocketId: 'ticker' });

  expect(client.unsubscribe).toHaveBeenCalledWith({ websocketId: 'ticker' });
  expect(context.websockets.ticker).toEqual(initialChannelState);

  // The pending flush timer was cleared — the buffered message never lands.
  jest.advanceTimersByTime(1000);
  expect(context.websockets.ticker.messages).toEqual([]);

  // Messages after unsubscribe are ignored.
  onMessage(serializer.serialize({ data: { tick: 3 } }));
  expect(context.websockets.ticker.messages).toEqual([]);
});

test('unsubscribe of an inactive websocketId is a no-op', () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }],
  });
  const websockets = new WebSockets(context);

  websockets.unsubscribe({ websocketId: 'ticker' });

  expect(client.unsubscribe).not.toHaveBeenCalled();
});

test('unsubscribe with non-string websocketId throws', () => {
  const { context } = createTestContext();
  const websockets = new WebSockets(context);

  expect(() => websockets.unsubscribe({ websocketId: 4 })).toThrow(
    'Unsubscribe requires a websocketId.'
  );
});

test('unsubscribeAll unsubscribes every active subscription', async () => {
  const { client, context } = createTestContext({
    subscriptions: [{ websocketId: 'ticker' }, { websocketId: 'chat' }],
  });
  const websockets = new WebSockets(context);
  await websockets.subscribe({ websocketId: 'ticker' });
  await websockets.subscribe({ websocketId: 'chat' });

  websockets.unsubscribeAll();

  expect(client.unsubscribe.mock.calls).toEqual([
    [{ websocketId: 'ticker' }],
    [{ websocketId: 'chat' }],
  ]);
});

test('publish serializes the payload and calls client publish', async () => {
  const { client, context } = createTestContext();
  const websockets = new WebSockets(context);

  await websockets.publish({ websocketId: 'chat', payload: { text: 'hi', at: new Date(1000) } });

  expect(client.publish).toHaveBeenCalledWith({
    websocketId: 'chat',
    payload: { text: 'hi', at: { '~d': 1000 } },
  });
});

test('publish defaults an empty payload and throws for non-string websocketId', async () => {
  const { client, context } = createTestContext();
  const websockets = new WebSockets(context);

  await websockets.publish({ websocketId: 'chat' });
  expect(client.publish).toHaveBeenCalledWith({ websocketId: 'chat', payload: {} });

  await expect(websockets.publish({ payload: {} })).rejects.toThrow(
    'Publish requires a websocketId.'
  );
});

test('subscribe throws a ConfigError for a websocketId with no subscription on the page', async () => {
  const { client, context } = createTestContext();
  const websockets = new WebSockets(context);

  await expect(websockets.subscribe({ websocketId: 'adhoc' })).rejects.toThrow(
    'Subscription "adhoc" is not defined on this page.'
  );
  expect(client.subscribe).not.toHaveBeenCalled();
});
