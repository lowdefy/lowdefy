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

import { randomUUID } from 'node:crypto';

import { registerTab, unregisterTab } from './tabChannel.js';

// A tab that cannot hold an event stream open - a phone shell whose fetch
// cannot stream a response body - polls /api/reload instead
// (src/routes/reload.js). It is registered in the tab channel like a streamed
// tab, but its events wait in a queue the next poll takes. A reload is read
// from build/reload, which reloadClients() rewrites after each build. A tab
// not polled for EXPIRY_MS is gone.
const EXPIRY_MS = 10000;

const polledTabs = new Map();
let sweepTimer = null;

function sweep(now) {
  polledTabs.forEach((tab, id) => {
    if (now - tab.lastPoll > EXPIRY_MS) {
      polledTabs.delete(id);
      unregisterTab({ id });
    }
  });
  if (polledTabs.size === 0 && sweepTimer !== null) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}

function startSweeping() {
  if (sweepTimer !== null) {
    return;
  }
  sweepTimer = setInterval(() => sweep(Date.now()), EXPIRY_MS);
  sweepTimer.unref?.();
}

function openPolledTab({ origin, readReloadStamp, now }) {
  const id = randomUUID();
  const tab = { events: [], lastPoll: now, reloadStamp: readReloadStamp() };
  polledTabs.set(id, tab);
  registerTab({
    id,
    send: (event, data) => {
      tab.events.push({ event, data: JSON.stringify(data) });
    },
    ...origin,
  });
  startSweeping();
  tab.events.push({ event: 'tab', data: JSON.stringify({ tabId: id }) });
  return id;
}

/**
 * One poll of a polled tab: `{ tabId, events }`, the events sent to it since the last poll as an
 * event stream carries them (`{ event, data }`, data a JSON string). An unknown or expired tabId
 * opens a new tab, whose first event is `tab` with its id, as on a stream.
 *
 * @param {Object} params
 * @param {string} [params.tabId] The tab's id from an earlier poll.
 * @param {Object} params.origin `{ source, automated, device }` of the tab (routes/reload.js tabOrigin).
 * @param {() => string|null} params.readReloadStamp The content of build/reload.
 * @param {number} [params.now]
 */
function pollTab({ tabId, origin, readReloadStamp, now = Date.now() }) {
  sweep(now);
  const id = polledTabs.has(tabId) ? tabId : openPolledTab({ origin, readReloadStamp, now });
  const tab = polledTabs.get(id);
  tab.lastPoll = now;
  const stamp = readReloadStamp();
  if (stamp !== null && stamp !== tab.reloadStamp) {
    tab.reloadStamp = stamp;
    tab.events.push({ event: 'reload', data: JSON.stringify({}) });
  }
  return { tabId: id, events: tab.events.splice(0) };
}

function closePolledTabs() {
  polledTabs.forEach((tab, id) => unregisterTab({ id }));
  polledTabs.clear();
  sweep(Date.now());
}

export { closePolledTabs };
export default pollTab;
