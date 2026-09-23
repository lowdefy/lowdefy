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
  const lowdefy = {
    _internal: {
      globals: {
        window: { location: { protocol: 'http:', host: 'localhost' }, WebSocket: MockWebSocket },
      },
      logger: { warn: jest.fn() },
    },
  };
  const client = createWebSocketClient(lowdefy);
  function open() {
    const socket = sockets[0];
    socket.readyState = MockWebSocket.OPEN;
    socket.onopen();
    return socket;
  }
  function receive(frame) {
    sockets[0].onmessage({ data: JSON.stringify(frame) });
  }
  return { client, lowdefy, open, receive };
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

test('a broadcast error frame passes its message string to the subscription onError handler', async () => {
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
  expect(handlers.onError).toHaveBeenCalledWith('Something went wrong.');
});

test('an error frame without an error payload rejects with its message', async () => {
  const { client, open, receive } = createTestClient();
  const promise = client.publish({ payload: { a: 1 }, websocketId: 'chat' });
  open();
  receive({ type: 'error', requestId: 'p1', message: 'Invalid frame.' });
  await expect(promise).rejects.toThrow('Invalid frame.');
});
