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
      this.close = jest.fn();
      sockets.push(this);
    }
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
  // Like a browser, a socket whose onclose handler was removed fires nothing.
  function closeSocket(socket) {
    socket.readyState = MockWebSocket.CLOSED;
    socket.onclose?.();
  }
  function close() {
    closeSocket(currentSocket());
  }
  function receive(frame) {
    currentSocket().onmessage({ data: JSON.stringify(frame) });
  }
  function sentFrames(socket) {
    return socket.send.mock.calls.map(([message]) => JSON.parse(message));
  }
  return {
    client,
    close,
    closeSocket,
    currentSocket,
    lowdefy,
    open,
    receive,
    sentFrames,
    sockets,
  };
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
  receive({ type: 'error', websocketId: 'chat', requestId: 's1', error: { '~e': wireError } });
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
    expect(sentFrames(reopened)).toEqual([
      { type: 'subscribe', websocketId: 'chat', payload: {}, requestId: 's2' },
    ]);
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
      { type: 'subscribe', websocketId: 'chat', payload: { a: 1 }, requestId: 's1' },
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

  test('a subscribe sent on an open connection that times out unsubscribes the feed and lets the socket close', async () => {
    const { client, open, sentFrames } = createTestClient();
    client.connect();
    const socket = open();
    const subscribed = track(
      client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' })
    );
    jest.advanceTimersByTime(10000);
    await flushPromises();
    expect(subscribed.state).toBe('rejected');
    expect(sentFrames(socket)).toEqual([
      { type: 'subscribe', websocketId: 'chat', payload: {}, requestId: 's1' },
      { type: 'unsubscribe', websocketId: 'chat' },
    ]);
    jest.advanceTimersByTime(5000);
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  test('a refused subscribe lets the idle socket close', async () => {
    const { client, open, receive } = createTestClient();
    const subscribed = track(
      client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' })
    );
    const socket = open();
    receive({ type: 'error', websocketId: 'chat', requestId: 's1', error: { '~e': wireError } });
    await flushPromises();
    expect(subscribed.state).toBe('rejected');
    jest.advanceTimersByTime(5000);
    expect(socket.close).toHaveBeenCalledTimes(1);
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
    expect(sentFrames(reopened)).toEqual([
      { type: 'subscribe', websocketId: 'chat', payload: {}, requestId: 's2' },
    ]);

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

  test('the close event of a socket closed for idleness does not disconnect the socket that replaced it', async () => {
    const { client, closeSocket, open, receive, sentFrames, sockets } = createTestClient();
    const handlers = createHandlers();
    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' });
    const idle = open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    client.unsubscribe({ websocketId: 'chat' });
    jest.advanceTimersByTime(5000);

    const subscribed = track(client.subscribe({ handlers, payload: {}, websocketId: 'chat' }));
    const replacement = open();
    receive({ type: 'subscribed', websocketId: 'chat' });
    await flushPromises();
    expect(subscribed.state).toBe('resolved');

    closeSocket(idle);
    client.publish({ payload: {}, websocketId: 'chat' });
    client.unsubscribe({ websocketId: 'chat' });
    expect(sockets).toHaveLength(2);
    expect(handlers.onDisconnected).not.toHaveBeenCalled();
    expect(sentFrames(replacement).map((frame) => frame.type)).toEqual([
      'subscribe',
      'publish',
      'unsubscribe',
    ]);
  });

  test('a socket closed for idleness that finishes closing while its replacement connects leaves one connection', () => {
    const { client, closeSocket, open, sentFrames, sockets } = createTestClient();
    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' });
    const idle = open();
    client.unsubscribe({ websocketId: 'chat' });
    jest.advanceTimersByTime(5000);

    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' });
    closeSocket(idle);
    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'news' });
    expect(sockets).toHaveLength(2);
    const replacement = open();
    expect(sentFrames(replacement)).toEqual([
      { type: 'subscribe', websocketId: 'chat', payload: {}, requestId: 's2' },
      { type: 'subscribe', websocketId: 'news', payload: {}, requestId: 's3' },
    ]);
  });

  test('a publish that timed out before a connection opened is not sent when one opens', async () => {
    const { client, close, open, receive, sentFrames } = createTestClient();
    const timedOut = track(client.publish({ payload: { n: 1 }, websocketId: 'chat' }));
    close();
    jest.advanceTimersByTime(10000);
    await flushPromises();
    expect(timedOut.state).toBe('rejected');
    expect(timedOut.error.message).toBe('WebSocket: Publish to "chat" timed out.');

    const retried = track(client.publish({ payload: { n: 2 }, websocketId: 'chat' }));
    const socket = open();
    expect(sentFrames(socket)).toEqual([
      { type: 'publish', websocketId: 'chat', requestId: 'p2', payload: { n: 2 } },
    ]);
    receive({ type: 'published', websocketId: 'chat', requestId: 'p2' });
    await flushPromises();
    expect(retried.state).toBe('resolved');
  });

  test('a reply to a subscribe that a newer subscribe replaced does not answer the newer one', async () => {
    const { client, open, receive } = createTestClient();
    client.connect();
    open();
    const handlers = createHandlers();
    client.subscribe({ handlers: createHandlers(), payload: { room: 1 }, websocketId: 'chat' });
    client.unsubscribe({ websocketId: 'chat' });
    const replacement = track(
      client.subscribe({ handlers, payload: { room: 2 }, websocketId: 'chat' })
    );

    receive({ type: 'error', websocketId: 'chat', requestId: 's1', error: { '~e': wireError } });
    receive({ type: 'subscribed', websocketId: 'chat', requestId: 's1' });
    await flushPromises();
    expect(replacement.state).toBe('pending');
    expect(handlers.onConnected).not.toHaveBeenCalled();
    expect(handlers.onError).not.toHaveBeenCalled();

    receive({ type: 'subscribed', websocketId: 'chat', requestId: 's2' });
    await flushPromises();
    expect(replacement.state).toBe('resolved');
    expect(handlers.onConnected).toHaveBeenCalledTimes(1);
  });

  test('an idle socket stays open until its pending publishes are answered', async () => {
    const { client, open, receive } = createTestClient();
    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' });
    const socket = open();
    receive({ type: 'subscribed', websocketId: 'chat', requestId: 's1' });
    const published = track(client.publish({ payload: {}, websocketId: 'chat' }));
    client.unsubscribe({ websocketId: 'chat' });
    jest.advanceTimersByTime(5000);
    expect(socket.close).not.toHaveBeenCalled();

    receive({ type: 'published', websocketId: 'chat', requestId: 'p1' });
    await flushPromises();
    expect(published.state).toBe('resolved');
    jest.advanceTimersByTime(5000);
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  test('a connection that opens after the last feed was unsubscribed closes once idle', () => {
    const { client, open } = createTestClient();
    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' });
    client.unsubscribe({ websocketId: 'chat' });
    jest.advanceTimersByTime(5000);
    const socket = open();
    expect(socket.close).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5000);
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  test('the reconnect backoff resets only after a connection has stayed open', () => {
    Math.random.mockReturnValue(0.99);
    const { client, close, open, receive, sockets } = createTestClient();
    client.subscribe({ handlers: createHandlers(), payload: {}, websocketId: 'chat' });
    open();
    receive({ type: 'subscribed', websocketId: 'chat', requestId: 's1' });
    close();
    // First retry: up to 500 ms.
    jest.advanceTimersByTime(500);
    expect(sockets).toHaveLength(2);
    open();
    close();
    // A connection dropped straight after opening does not reset the backoff: up to 1000 ms.
    jest.advanceTimersByTime(500);
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(500);
    expect(sockets).toHaveLength(3);
    open();
    jest.advanceTimersByTime(10000);
    close();
    jest.advanceTimersByTime(500);
    expect(sockets).toHaveLength(4);
  });
});
