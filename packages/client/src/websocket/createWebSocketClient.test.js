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
import { getDevError } from '@lowdefy/engine';

import createWebSocketClient from './createWebSocketClient.js';

const wireError = {
  name: 'Error',
  message: 'Something went wrong.',
  requestId: 'rid-1',
  isLowdefyError: true,
};

function createHandlers() {
  return {
    onConnected: jest.fn(),
    onDisconnected: jest.fn(),
    onError: jest.fn(),
    onMessage: jest.fn(),
  };
}

function createTestClient() {
  const sockets = [];
  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.send = jest.fn();
      sockets.push(this);
    }
    close() {}
  }
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSED = 3;
  const lowdefy = {
    _internal: {
      globals: {
        window: { location: { protocol: 'http:', host: 'localhost' }, WebSocket: MockWebSocket },
      },
      logger: { warn: jest.fn() },
    },
  };
  const client = createWebSocketClient(lowdefy);
  function currentSocket() {
    return sockets[sockets.length - 1];
  }
  function open() {
    const socket = currentSocket();
    socket.readyState = MockWebSocket.OPEN;
    socket.onopen();
    return socket;
  }
  function close() {
    const socket = currentSocket();
    socket.readyState = MockWebSocket.CLOSED;
    socket.onclose();
  }
  function receive(frame) {
    currentSocket().onmessage({ data: JSON.stringify(frame) });
  }
  function sentFrames(socket) {
    return socket.send.mock.calls.map(([message]) => JSON.parse(message));
  }
  return { client, close, currentSocket, lowdefy, open, receive, sentFrames, sockets };
}

function track(promise) {
  const result = { state: 'pending', error: null };
  promise.then(
    () => {
      result.state = 'resolved';
    },
    (error) => {
      result.state = 'rejected';
      result.error = error;
    }
  );
  return result;
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

test('a failed publish rejects with the decoded wire error', async () => {
  const { client, open, receive } = createTestClient();
  const promise = client.publish({ payload: { a: 1 }, websocketId: 'chat' });
  open();
  receive({ type: 'error', websocketId: 'chat', requestId: 'p1', error: { '~e': wireError } });
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe('Something went wrong.');
  expect(error.requestId).toBe('rid-1');
  expect(getDevError(error)).toBeUndefined();
});

test('a dev error frame keeps devError off the rejected error and reachable through getDevError', async () => {
  const { client, open, receive } = createTestClient();
  const promise = client.publish({ payload: { a: 1 }, websocketId: 'chat' });
  open();
  receive({
    type: 'error',
    websocketId: 'chat',
    requestId: 'p1',
    error: {
      '~e': wireError,
      devError: { '~e': { name: 'Error', message: 'Publish routine failed.' } },
    },
  });
  const error = await promise.catch((e) => e);
  expect(error.message).toBe('Something went wrong.');
  expect(Object.getOwnPropertyNames(error)).not.toContain('devError');
  expect(getDevError(error).message).toBe('Publish routine failed.');
});

test('a failed subscribe rejects with the decoded wire error', async () => {
  const { client, open, receive } = createTestClient();
  const handlers = {
    onConnected: jest.fn(),
    onDisconnected: jest.fn(),
    onError: jest.fn(),
    onMessage: jest.fn(),
  };
  const promise = client.subscribe({ handlers, payload: {}, websocketId: 'chat' });
  open();
  receive({ type: 'error', websocketId: 'chat', error: { '~e': wireError } });
  const error = await promise.catch((e) => e);
  expect(error.message).toBe('Something went wrong.');
  expect(error.requestId).toBe('rid-1');
});

test('a broadcast error frame passes its message to the subscription onError handler as a WebSocket ServiceError', async () => {
  const { client, open, receive } = createTestClient();
  const handlers = {
    onConnected: jest.fn(),
    onDisconnected: jest.fn(),
    onError: jest.fn(),
    onMessage: jest.fn(),
  };
  const promise = client.subscribe({ handlers, payload: {}, websocketId: 'chat' });
  open();
  receive({ type: 'subscribed', websocketId: 'chat' });
  await promise;
  receive({ type: 'error', websocketId: 'chat', message: 'Something went wrong.' });
  expect(handlers.onError).toHaveBeenCalledWith('WebSocket: Something went wrong.');
});

test('an error frame without an error payload rejects with its message', async () => {
  const { client, open, receive } = createTestClient();
  const promise = client.publish({ payload: { a: 1 }, websocketId: 'chat' });
  open();
  receive({ type: 'error', requestId: 'p1', message: 'Invalid frame.' });
  await expect(promise).rejects.toThrow('Invalid frame.');
});

describe('subscribe ack timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reconnect backoff is random; zero makes the reconnect fire on the next timer tick.
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('a feed subscribed again after an unsubscribe is kept when the first subscribe would have timed out', async () => {
    const { client, close, open, receive, sentFrames, sockets } = createTestClient();
    const firstHandlers = createHandlers();
    const secondHandlers = createHandlers();
    const first = track(
      client.subscribe({ handlers: firstHandlers, payload: {}, websocketId: 'chat' })
    );
    client.unsubscribe({ websocketId: 'chat' });
    jest.advanceTimersByTime(5000);
    const second = track(
      client.subscribe({ handlers: secondHandlers, payload: {}, websocketId: 'chat' })
    );
    open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    await flushPromises();
    expect(second.state).toBe('resolved');

    // Past the first subscribe's ack deadline.
    jest.advanceTimersByTime(10000);
    await flushPromises();
    expect(secondHandlers.onError).not.toHaveBeenCalled();

    // The feed is still in the set resubscribed when the connection reopens.
    close();
    jest.advanceTimersByTime(0);
    expect(sockets).toHaveLength(2);
    const reopened = open();
    expect(sentFrames(reopened)).toEqual([{ type: 'subscribe', websocketId: 'chat', payload: {} }]);
    receive({ type: 'message', websocketId: 'chat', payload: 'hello' });
    expect(secondHandlers.onMessage).toHaveBeenCalledWith('hello');
    expect(first.state).toBe('resolved');
  });

  test('an unsubscribe settles a subscribe still waiting for its ack without an error', async () => {
    const { client } = createTestClient();
    const subscribed = track(
      client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' })
    );
    client.unsubscribe({ websocketId: 'chat' });
    await flushPromises();
    expect(subscribed.state).toBe('resolved');
    jest.advanceTimersByTime(10000);
    await flushPromises();
    expect(subscribed.state).toBe('resolved');
  });

  test('a subscribe to a feed that is still waiting for its ack settles the earlier subscribe and keeps the feed', async () => {
    const { client, open, receive } = createTestClient();
    const firstHandlers = createHandlers();
    const secondHandlers = createHandlers();
    const first = track(
      client.subscribe({ handlers: firstHandlers, payload: {}, websocketId: 'chat' })
    );
    jest.advanceTimersByTime(5000);
    const second = track(
      client.subscribe({ handlers: secondHandlers, payload: {}, websocketId: 'chat' })
    );
    await flushPromises();
    expect(first.state).toBe('resolved');
    open();
    jest.advanceTimersByTime(6000);
    await flushPromises();
    expect(second.state).toBe('pending');
    receive({ type: 'subscribed', websocketId: 'chat' });
    await flushPromises();
    expect(second.state).toBe('resolved');
    receive({ type: 'message', websocketId: 'chat', payload: 'hello' });
    expect(secondHandlers.onMessage).toHaveBeenCalledWith('hello');
    expect(firstHandlers.onMessage).not.toHaveBeenCalled();
  });

  test('a subscribe queued while the socket connects is sent once when the connection opens', () => {
    const { client, open, sentFrames } = createTestClient();
    client.subscribe({ handlers: createHandlers(), payload: { a: 1 }, websocketId: 'chat' });
    const socket = open();
    expect(sentFrames(socket)).toEqual([
      { type: 'subscribe', websocketId: 'chat', payload: { a: 1 } },
    ]);
  });

  test('a subscribe that never gets a connection rejects when its ack times out', async () => {
    const { client } = createTestClient();
    const subscribed = track(
      client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' })
    );
    jest.advanceTimersByTime(10000);
    await flushPromises();
    expect(subscribed.state).toBe('rejected');
    expect(subscribed.error.message).toBe('WebSocket: Subscribe to "chat" timed out.');
  });

  test('a subscribe sent into a connection that closes gets a fresh ack timeout when it is resent on reconnect', async () => {
    const { client, close, open, receive, sentFrames, sockets } = createTestClient();
    client.connect();
    open();
    const subscribed = track(
      client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' })
    );
    jest.advanceTimersByTime(6000);
    close();
    jest.advanceTimersByTime(2000);
    expect(sockets).toHaveLength(2);
    const reopened = open();
    expect(sentFrames(reopened)).toEqual([{ type: 'subscribe', websocketId: 'chat', payload: {} }]);

    // Past the first send's ack deadline, inside the resend's.
    jest.advanceTimersByTime(5000);
    await flushPromises();
    expect(subscribed.state).toBe('pending');
    receive({ type: 'subscribed', websocketId: 'chat' });
    await flushPromises();
    expect(subscribed.state).toBe('resolved');
  });

  test('a resubscribe on reconnect that is never acked reports a timeout to the subscription onError handler', async () => {
    const { client, close, open, receive } = createTestClient();
    const handlers = createHandlers();
    const subscribed = track(client.subscribe({ handlers, payload: {}, websocketId: 'chat' }));
    open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    await flushPromises();
    expect(subscribed.state).toBe('resolved');

    close();
    jest.advanceTimersByTime(0);
    open();
    jest.advanceTimersByTime(10000);
    expect(handlers.onError).toHaveBeenCalledWith('WebSocket: Subscribe to "chat" timed out.');

    // The feed stays subscribed, so the next reconnect resubscribes it.
    close();
    jest.advanceTimersByTime(0);
    open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    expect(handlers.onConnected).toHaveBeenCalledTimes(2);
  });

  test('a resubscribe sent into a connection that closes does not report a timeout while disconnected', async () => {
    const { client, close, open, receive } = createTestClient();
    const handlers = createHandlers();
    client.subscribe({ handlers, payload: {}, websocketId: 'chat' });
    open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    close();
    jest.advanceTimersByTime(0);
    open();
    close();
    // Keep the next connection attempt from opening.
    jest.advanceTimersByTime(10000);
    expect(handlers.onError).not.toHaveBeenCalled();
  });

  test('an acked subscribe does not time out', async () => {
    const { client, open, receive } = createTestClient();
    const handlers = createHandlers();
    const subscribed = track(client.subscribe({ handlers, payload: {}, websocketId: 'chat' }));
    open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    jest.advanceTimersByTime(20000);
    await flushPromises();
    expect(subscribed.state).toBe('resolved');
    expect(handlers.onError).not.toHaveBeenCalled();
  });
});
