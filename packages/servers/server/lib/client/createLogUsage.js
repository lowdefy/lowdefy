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
import { v4 as uuid } from 'uuid';
import { createUrl } from '@lowdefy/client/adapters/url.js';

// What about public usage

const MACHINE_ID_KEY = 'lowdefy_machine_id';

// Where the machine id is kept: the host's store for a page that runs on
// another origin than its app (an MCP App view, whose own browser storage
// belongs to the frame's origin), else the browser's localStorage.
function getMachineStore({ host }) {
  if (host) {
    return host.storage;
  }
  return {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value),
  };
}

// Storage can be disabled (a private window, blocked site data), and then every access
// throws: fall back to an id for this page load.
function getMachineId({ host }) {
  try {
    const store = getMachineStore({ host });
    let machine = store.get(MACHINE_ID_KEY);
    if (!machine) {
      machine = uuid();
      store.set(MACHINE_ID_KEY, machine);
    }
    return machine;
  } catch (error) {
    return uuid();
  }
}

// host is given only by a page that runs on another origin than its app (an MCP App view): its
// usage call goes to the app's absolute address with the view's bearer session, and its machine
// id is kept in the host's store. A browser tab gives none: App.jsx builds this before the client
// makes its host, and the call goes to the app's own origin under basePath.
function createLogUsage({ basePath, host, usageDataRef }) {
  let lastTimestamp = 0;
  let isOffline = false;
  const machine = getMachineId({ host });

  function postUsage(init) {
    if (host) {
      return host.view.fetchApi('/api/usage', init);
    }
    return fetch(createUrl({ basePath, pathname: '/api/usage' }), init);
  }

  // Runs on every event and nothing awaits it, so a failure (the usage route unreachable, a proxy
  // answering with an HTML page, telemetry blocked) is dropped here instead of surfacing as an
  // unhandled rejection. Usage logging never affects the app.
  async function logUsage() {
    if (isOffline || lastTimestamp > Date.now() - 1000 * 60 * 15) {
      return;
    }
    lastTimestamp = Date.now();

    try {
      const res = await postUsage({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: usageDataRef.current.user, machine }),
      });
      if (!res.ok) {
        return;
      }
      const { offline, data } = await res.json();
      if (offline) {
        isOffline = true;
        return;
      }
      await fetch('https://api.lowdefy.net/v4/telemetry/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Dropped: see above.
    }
  }
  return logUsage;
}

export default createLogUsage;
