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

// The manager's proxy (startProxy) is the only HTTP client of this server, and
// reuses its connections to it. Node closes a connection left idle past
// keepAliveTimeout on a timer, and timers run before the event loop reads
// sockets. So when synchronous work blocks the loop for longer than the timer
// (a page build deserializing large build artifacts takes seconds), a request
// the proxy has already written is never read: the expired timer closes the
// socket over it, the client sees ECONNRESET, and a POST cannot be replayed
// because the proxy cannot tell whether the app ran it. With no timer here, the
// proxy's agent alone decides when an idle connection closes, and a request
// waits out the blocked loop instead.
function keepIdleConnectionsOpen() {
  return {
    name: 'lowdefy-keep-idle-connections-open',
    configureServer(server) {
      server.httpServer.keepAliveTimeout = 0;
    },
  };
}

export default keepIdleConnectionsOpen;
