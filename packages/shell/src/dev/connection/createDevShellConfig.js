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

import createDevTransport from './createDevTransport.js';

/**
 * Lowdefy Dev's shell config for one dev server: its one app is that server, named by its host,
 * and its calls carry the server's pairing token (shell.transport, read by createShellApp). Each
 * server is its own app, so its cache, session token and storage are kept apart from another's.
 *
 * @param {Object} params
 * @param {Object} params.server `{ url, host, pair }`.
 * @param {Object} params.shell The shell config (getShellConfig).
 * @param {Function} [params.fetch] The Fetch API.
 * @param {Function} [params.WebSocket] The WebSocket class.
 */
function createDevShellConfig({
  fetch = globalThis.fetch,
  server,
  shell,
  WebSocket = globalThis.WebSocket,
}) {
  return {
    ...shell,
    apps: [
      {
        id: `dev-${server.host.replace(/[^A-Za-z0-9._-]/g, '_')}`,
        name: server.host,
        urls: { [shell.environment]: server.url },
      },
    ],
    transport: createDevTransport({ fetch, pair: server.pair, WebSocket }),
  };
}

export default createDevShellConfig;
