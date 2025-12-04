/*
  Copyright 2020-2024 Lowdefy, Inc

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

// What if this fails?
// What about public usage

function createLogUsage({ usageDataRef }) {
  let lastTimestamp = 0;
  let isOffline = false;
  let machine = localStorage.getItem('lowdefy_machine_id');
  if (!machine) {
    machine = uuid();
    localStorage.setItem('lowdefy_machine_id', machine);
  }

  async function logUsage() {
    if (isOffline || lastTimestamp > Date.now() - 1000 * 60 * 15) {
      return;
    }
    lastTimestamp = Date.now();

    const res = await fetch('/api/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: usageDataRef.current.user, machine }),
    });
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
  }
  return logUsage;
}

export default createLogUsage;
