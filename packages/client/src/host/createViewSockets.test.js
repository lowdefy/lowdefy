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

import { expect, test, vi } from 'vitest';

import createViewSockets from './createViewSockets.js';

function createWindow() {
  const made = [];
  function FakeWebSocket(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = FakeWebSocket.OPEN;
    this.close = vi.fn();
    made.push(this);
  }
  FakeWebSocket.CONNECTING = 0;
  FakeWebSocket.OPEN = 1;
  FakeWebSocket.CLOSING = 2;
  FakeWebSocket.CLOSED = 3;
  return { made, window: { WebSocket: FakeWebSocket } };
}

test('createViewSockets makes sockets of the frame with the same ready states', () => {
  const { made, window } = createWindow();
  const { getWebSocket } = createViewSockets({ window });
  const ViewWebSocket = getWebSocket();
  expect(getWebSocket()).toBe(ViewWebSocket);
  const socket = new ViewWebSocket('wss://app.example.com/api/websocket', ['lowdefy.view']);
  expect(socket).toBe(made[0]);
  expect(socket.url).toBe('wss://app.example.com/api/websocket');
  expect(socket.protocols).toEqual(['lowdefy.view']);
  expect(ViewWebSocket.OPEN).toBe(1);
  expect(ViewWebSocket.CLOSED).toBe(3);
});

test('createViewSockets closeAll closes open sockets with the client handlers taken off', () => {
  const { window } = createWindow();
  const { closeAll, getWebSocket } = createViewSockets({ window });
  const ViewWebSocket = getWebSocket();
  const socket = new ViewWebSocket('wss://app.example.com/api/websocket');
  socket.onclose = vi.fn();
  socket.onmessage = vi.fn();
  closeAll();
  expect(socket.close).toHaveBeenCalledTimes(1);
  expect(socket.onclose).toBeNull();
  expect(socket.onmessage).toBeNull();
  closeAll();
  expect(socket.close).toHaveBeenCalledTimes(1);
});

test('createViewSockets closeAll leaves a socket that already closed alone', () => {
  const { window } = createWindow();
  const { closeAll, getWebSocket } = createViewSockets({ window });
  const ViewWebSocket = getWebSocket();
  const closed = new ViewWebSocket('wss://app.example.com/api/websocket');
  const open = new ViewWebSocket('wss://app.example.com/api/websocket');
  closed.readyState = 3;
  closeAll();
  expect(closed.close).not.toHaveBeenCalled();
  expect(open.close).toHaveBeenCalledTimes(1);
});

test('createViewSockets forgets closed sockets when the next one is made', () => {
  const { window } = createWindow();
  const { closeAll, getWebSocket } = createViewSockets({ window });
  const ViewWebSocket = getWebSocket();
  const first = new ViewWebSocket('wss://app.example.com/api/websocket');
  first.readyState = 3;
  const second = new ViewWebSocket('wss://app.example.com/api/websocket');
  first.readyState = 1;
  closeAll();
  expect(first.close).not.toHaveBeenCalled();
  expect(second.close).toHaveBeenCalledTimes(1);
});
