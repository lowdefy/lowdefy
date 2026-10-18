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

// Orders instance renders across tabs, so "most recently rendered" does not hang on clock ticks.
let renderSequence = 0;

// A tab the dev server's own headless browser opened (a journey run, a
// headless tool) is automated: it is listed, so the hub keeps
// the server alive while it runs, but findPageInstance never picks it for an
// agent's or developer's live-tab request.
//
// A phone shell (Lowdefy Dev) registers with `device`: { shell, platform, app,
// paired } - its shell version, 'ios' or 'android', its bundle id, and whether
// it came in over the network with the pairing token rather than on this
// computer's localhost (a simulator, or a USB phone through adb reverse). A
// browser tab has none. The device tools address a phone by its tab id.
function registerTab({ id, send, source = 'dev', automated = false, device = null }) {
  if (type.isNone(id) || !type.isString(id)) {
    throw new Error(`registerTab requires an "id" string. Received ${JSON.stringify(id)}.`);
  }
  if (!type.isFunction(send)) {
    throw new Error('registerTab requires a "send" function.');
  }
  tabs.set(id, {
    id,
    page: null,
    rendered: new Map(),
    send,
    source,
    automated,
    device,
    connectedAt: new Date(),
  });
}

function getTab({ id }) {
  return tabs.get(id);
}

// Records the page instance a tab shows, { pageId, pathParams, instanceKey }, and keeps it among
// the instances the tab has rendered, whose contexts the tab still holds.
function updateTabPage({ id, pageId, pathParams, instanceKey }) {
  const tab = tabs.get(id);
  if (type.isNone(tab)) {
    // The tab may have disconnected between the client sending the ping and
    // it arriving — nothing to update, and not worth failing the request.
    return;
  }
  if (!type.isString(pageId) || !type.isString(instanceKey)) {
    throw new Error(
      `updateTabPage requires "pageId" and "instanceKey" strings. Received ${JSON.stringify({
        pageId,
        instanceKey,
      })}.`
    );
  }
  renderSequence += 1;
  const page = { pageId, pathParams: pathParams ?? {}, instanceKey };
  tab.page = page;
  tab.rendered.set(instanceKey, { ...page, sequence: renderSequence });
}

function unregisterTab({ id }) {
  tabs.delete(id);
}

function listTabs() {
  return Array.from(tabs.values()).map(({ id, page, source, automated, device, connectedAt }) => ({
    id,
    pageId: page?.pageId ?? null,
    pathParams: page?.pathParams ?? null,
    instanceKey: page?.instanceKey ?? null,
    source,
    automated,
    device,
    connectedAt,
  }));
}

// Path values compare as strings: a tab reports them decoded from its URL, an agent may pass
// a number.
function pathParamsMatch({ requested, rendered }) {
  if (type.isNone(requested)) {
    return true;
  }
  const requestedKeys = Object.keys(requested);
  if (requestedKeys.length !== Object.keys(rendered).length) {
    return false;
  }
  return requestedKeys.every((key) => String(requested[key]) === rendered[key]);
}

function instanceMatches({ instance, pageId, pathParams }) {
  if (type.isNone(pageId)) {
    return true;
  }
  return (
    instance.pageId === pageId &&
    pathParamsMatch({ requested: pathParams, rendered: instance.pathParams })
  );
}

// Which tab and page instance a dev tool request reads, as { tab, pageId, pathParams,
// instanceKey }, or undefined when no tab has one:
//   - the instance on screen in a tab, when one shows the requested page (and values), the most
//     recently connected such tab first (Map order: a reconnect deletes and re-sets the tab id);
//   - else the requested page's most recently rendered instance (with those values) in any tab,
//     whose context that tab still holds.
// A request naming no page reads the instance on screen in the most recently connected tab.
// Automated tabs and phones are skipped: a phone is read only when a tool names it (`device`,
// findTabInstance), so a request meant for the browser never reads a phone on the same page.
function findPageInstance({ pageId, pathParams } = {}) {
  const candidates = Array.from(tabs.values()).filter(
    (tab) => !tab.automated && type.isNone(tab.device)
  );
  const onScreen = candidates.filter(
    (tab) => !type.isNone(tab.page) && instanceMatches({ instance: tab.page, pageId, pathParams })
  );
  if (onScreen.length > 0) {
    const tab = onScreen[onScreen.length - 1];
    return { tab, ...tab.page };
  }
  if (type.isNone(pageId)) {
    return undefined;
  }
  let found;
  candidates.forEach((tab) => {
    tab.rendered.forEach((instance) => {
      if (!instanceMatches({ instance, pageId, pathParams })) {
        return;
      }
      if (type.isNone(found) || instance.sequence > found.sequence) {
        found = { tab, ...instance };
      }
    });
  });
  if (type.isNone(found)) {
    return undefined;
  }
  const { sequence, ...instance } = found;
  return instance;
}

// The instance a request to one named tab reads: the one it shows, or with a
// pageId, that page's instance on screen there or else the most recently
// rendered one it still holds. A request naming no page and a tab showing none
// yet (an injection, a step) reads no instance: the tab answers from its own
// screen. Returns { instance } or { error }.
function findTabInstance({ tabId, pageId, pathParams }) {
  const tab = tabs.get(tabId);
  if (type.isNone(tab)) {
    return {
      error: `No tab "${tabId}" is connected. lowdefy_device with action "list" names the connected phones.`,
    };
  }
  if (type.isNone(pageId)) {
    return { instance: { tab, pageId: null, pathParams: null, instanceKey: null, ...tab.page } };
  }
  if (!type.isNone(tab.page) && instanceMatches({ instance: tab.page, pageId, pathParams })) {
    return { instance: { tab, ...tab.page } };
  }
  let found;
  tab.rendered.forEach((instance) => {
    if (!instanceMatches({ instance, pageId, pathParams })) {
      return;
    }
    if (type.isNone(found) || instance.sequence > found.sequence) {
      found = instance;
    }
  });
  if (type.isNone(found)) {
    const shows = type.isNone(tab.page) ? 'no page yet' : `page "${tab.page.pageId}"`;
    return {
      error: `Tab "${tabId}" has not shown ${describeRequestedPage({
        pageId,
        pathParams,
      })}; it shows ${shows}. Open the page on the device first.`,
    };
  }
  const { sequence, ...instance } = found;
  return { instance: { tab, ...instance } };
}

function describeRequestedPage({ pageId, pathParams }) {
  if (type.isNone(pageId)) {
    return 'any page';
  }
  if (type.isNone(pathParams)) {
    return `page "${pageId}"`;
  }
  return `page "${pageId}" with pathParams ${JSON.stringify(pathParams)}`;
}

// Sends one request to a tab and resolves with what it answers. With tabId the
// request goes to that tab (findTabInstance), else to the tab findPageInstance
// picks for the page.
function requestFromTab({ tabId, pageId, pathParams, event, payload = {}, timeout = 5000 }) {
  if (type.isNone(event) || !type.isString(event)) {
    throw new Error(
      `requestFromTab requires an "event" string. Received ${JSON.stringify(event)}.`
    );
  }
  let instance;
  if (type.isNone(tabId)) {
    instance = findPageInstance({ pageId, pathParams });
    if (type.isNone(instance)) {
      return Promise.resolve({
        error: `No browser tab connected on ${describeRequestedPage({
          pageId,
          pathParams,
        })}. Ask the developer to open the page, or use source: "headless".`,
      });
    }
  } else {
    const found = findTabInstance({ tabId, pageId, pathParams });
    if (!type.isUndefined(found.error)) {
      return Promise.resolve({ error: found.error });
    }
    instance = found.instance;
  }

  const requestId = randomUUID();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve({ error: `Timed out waiting ${timeout}ms for a response from the tab.` });
    }, timeout);

    pendingRequests.set(requestId, (result) => {
      clearTimeout(timer);
      pendingRequests.delete(requestId);
      resolve(result);
    });

    instance.tab.send(event, {
      requestId,
      pageId: instance.pageId,
      pathParams: instance.pathParams,
      instanceKey: instance.instanceKey,
      ...payload,
    });
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

export {
  findPageInstance,
  getTab,
  listTabs,
  registerTab,
  requestFromTab,
  resolveTabRequest,
  unregisterTab,
  updateTabPage,
};
