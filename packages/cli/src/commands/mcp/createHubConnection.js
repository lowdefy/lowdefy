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

import connectHub from '../hub/connectHub.js';

// One hub connection per shim, opened on first need and re-opened if the hub
// restarts. Attachments live on the connection - they tell the hub which
// servers a session is using, so it never reaps them - so a new connection
// re-attaches everything the old one had.
function createHubConnection() {
  let client = null;
  const attached = new Set();

  async function get({ autoStart = true } = {}) {
    if (client !== null) {
      return client;
    }
    const next = await connectHub({ autoStart });
    if (next === null) {
      return null;
    }
    next.onClose(() => {
      if (client === next) {
        client = null;
      }
    });
    client = next;
    await Promise.all(
      [...attached].map((configDirectory) => client.request('attach', { configDirectory }))
    );
    return client;
  }

  async function request(method, params, options) {
    const hub = await get(options);
    if (hub === null) {
      return null;
    }
    return hub.request(method, params);
  }

  async function attach({ configDirectory }) {
    attached.add(configDirectory);
    await request('attach', { configDirectory });
  }

  function isConnected() {
    return client !== null;
  }

  function close() {
    client?.close();
  }

  return { attach, close, isConnected, request };
}

export default createHubConnection;
