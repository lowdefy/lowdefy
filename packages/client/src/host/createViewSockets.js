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

const STATES = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// The websockets of a view. A view that has ended (its fallback is shown) must
// hold no connection, and the websocket client keeps its socket for a while
// after the last feed is gone, so the host keeps the sockets it made and
// closes them itself.
//
// WebSocket is what the host gives the core: it makes a socket of the frame
// and remembers it. Sockets that have closed are forgotten when the next one
// is made, so the client's own handlers stay the only ones on a socket.
// closeAll closes every socket not yet closed
// and takes the client's handlers off first, so the close reaches no client
// state and starts no reconnect.
function createViewSockets({ window }) {
  const sockets = new Set();
  let ViewWebSocket = null;

  function getWebSocket() {
    if (ViewWebSocket === null) {
      const FrameWebSocket = window.WebSocket;
      ViewWebSocket = function WebSocket(url, protocols) {
        sockets.forEach((made) => {
          if (made.readyState === FrameWebSocket.CLOSED) {
            sockets.delete(made);
          }
        });
        const socket = new FrameWebSocket(url, protocols);
        sockets.add(socket);
        return socket;
      };
      STATES.forEach((state) => {
        ViewWebSocket[state] = FrameWebSocket[state];
      });
    }
    return ViewWebSocket;
  }

  function closeAll() {
    sockets.forEach((socket) => {
      if (socket.readyState === window.WebSocket.CLOSED) {
        return;
      }
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.onopen = null;
      socket.close();
    });
    sockets.clear();
  }

  return { closeAll, getWebSocket };
}

export default createViewSockets;
