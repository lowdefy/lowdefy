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

// Browser storage can be disabled (a private window, blocked site data), and then every access
// throws: fall back to an id for this page load.
function getMachineId() {
  try {
    let machine = localStorage.getItem('lowdefy_machine_id');
    if (!machine) {
      machine = uuid();
      localStorage.setItem('lowdefy_machine_id', machine);
    }
    return machine;
  } catch (error) {
    return uuid();
  }
}

function createLogUsage({ basePath, usageDataRef }) {
  let lastTimestamp = 0;
  let isOffline = false;
  const machine = getMachineId();

  // Runs on every event and nothing awaits it, so a failure (the usage route unreachable, a proxy
  // answering with an HTML page, telemetry blocked) is dropped here instead of surfacing as an
  // unhandled rejection. Usage logging never affects the app.
  async function logUsage() {
    if (isOffline || lastTimestamp > Date.now() - 1000 * 60 * 15) {
      return;
    }
    lastTimestamp = Date.now();

    try {
      const res = await fetch(createUrl({ basePath, pathname: '/api/usage' }), {
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
