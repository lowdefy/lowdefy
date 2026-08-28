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

import { type } from '@lowdefy/helpers';

// Live channel between the dev server and a developer's real browser tab —
// lets an agent read `window.lowdefy` state / evaluate operators against it.
// Two module-level registries, mirroring the pendingContexts pattern in
// src/websocket/devWebSocket.js:
//   - tabs: connected SSE streams, one per open browser tab, keyed by tab id.
//   - pendingRequests: in-flight request/response correlations, keyed by
//     requestId, resolved either by resolveTabRequest (POST from the tab) or
//     by the request's own timeout.
const tabs = new Map();
const pendingRequests = new Map();

function registerTab({ id, pageId, send }) {
  if (type.isNone(id) || !type.isString(id)) {
    throw new Error(`registerTab requires an "id" string. Received ${JSON.stringify(id)}.`);
  }
  if (!type.isFunction(send)) {
    throw new Error('registerTab requires a "send" function.');
  }
  tabs.set(id, { id, pageId: pageId ?? null, send, connectedAt: new Date() });
}

function updateTabPage({ id, pageId }) {
  const tab = tabs.get(id);
  if (type.isNone(tab)) {
    // The tab may have disconnected between the client sending the ping and
    // it arriving — nothing to update, and not worth failing the request.
    return;
  }
  tab.pageId = pageId ?? null;
}

function unregisterTab({ id }) {
  tabs.delete(id);
}

function listTabs() {
  return Array.from(tabs.values()).map(({ id, pageId, connectedAt }) => ({
    id,
    pageId,
    connectedAt,
  }));
}

// Most recently connected tab wins — Map preserves insertion order, and
// re-registering a tab id (reconnect) deletes then re-sets it, so the last
// entry is always the most recent connection.
function findTab({ pageId }) {
  const candidates = Array.from(tabs.values()).filter(
    (tab) => type.isNone(pageId) || tab.pageId === pageId
  );
  if (candidates.length === 0) {
    return undefined;
  }
  return candidates[candidates.length - 1];
}

function requestFromTab({ pageId, event, payload = {}, timeout = 5000 }) {
  if (type.isNone(event) || !type.isString(event)) {
    throw new Error(
      `requestFromTab requires an "event" string. Received ${JSON.stringify(event)}.`
    );
  }
  const tab = findTab({ pageId });
  if (type.isNone(tab)) {
    const location = type.isNone(pageId) ? 'any page' : `page "${pageId}"`;
    return Promise.resolve({
      error: `No browser tab connected on ${location}. Ask the developer to open the page, or use source: "headless".`,
    });
  }

  const requestId = randomUUID();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve({ error: `Timed out waiting ${timeout}ms for a response from the browser tab.` });
    }, timeout);

    pendingRequests.set(requestId, (result) => {
      clearTimeout(timer);
      pendingRequests.delete(requestId);
      resolve(result);
    });

    tab.send(event, { requestId, ...payload });
  });
}

function resolveTabRequest({ requestId, result }) {
  const resolver = pendingRequests.get(requestId);
  if (type.isNone(resolver)) {
    // Answer arrived after the request already timed out (or for an unknown
    // requestId) — nothing left to resolve.
    return false;
  }
  resolver(result);
  return true;
}

export { listTabs, registerTab, requestFromTab, resolveTabRequest, unregisterTab, updateTabPage };
