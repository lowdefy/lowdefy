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

import { getAuthorizationHeaders } from '@lowdefy/client-core';

import isNetworkError from './isNetworkError.js';
import summarizeQueue from './summarizeQueue.js';

const QUEUED_MESSAGE = 'Queued until the phone is back online.';

async function readError(res) {
  try {
    const body = await res.json();
    return body?.message ?? body?.error?.message ?? `The server answered ${res.status}.`;
  } catch (error) {
    return `The server answered ${res.status}.`;
  }
}

/**
 * The offline request queue: the host's `requestQueue`, which `offline: queue` requests go through
 * (@lowdefy/client-core createCallRequest).
 *
 * - A request is kept when the shell is offline, when the send fails for the network, or when
 *   earlier requests still wait (order is kept). Its action resolves with { queued: true, id } as
 *   the response. The body, with the payload evaluated when the action ran, is sent unchanged on
 *   every try, so a `_uuid` in the payload is a stable idempotency key.
 * - The queue sends in order, one at a time, when the shell comes back online, at launch and on
 *   RetryRequestQueue. A 2xx removes the item. A network failure stops the replay and keeps it
 *   pending. A 401 stops too: the session ended, and sign-out clears the queue. Any other answer
 *   (a validation error, a 409 conflict, a 403) marks it failed with the server's message, kept
 *   until RetryRequestQueue or DiscardQueuedRequest; the replay moves on. A request refused for
 *   another build goes through the shell's fetch, which syncs and retries it when its page did not
 *   change (createShellFetch).
 * - Every change fires the app's onRequestQueue event with { pending, failed, sent, items }.
 *
 * @param {Object} params
 * @param {string} params.appId
 * @param {Function} params.fetch The shell's fetch (createShellFetch).
 * @param {{ isOnline, subscribe }} params.networkStatus
 * @param {() => string} params.newId Makes a queue item id.
 * @param {Object} params.queueStore createSqliteQueueStore.
 * @param {{ get }} params.tokenStore
 * @param {Function} params.triggerAppEvent
 */
function createRequestQueue({
  appId,
  fetch,
  networkStatus,
  newId,
  queueStore,
  tokenStore,
  triggerAppEvent,
}) {
  let replaying = null;

  async function get() {
    return summarizeQueue(await queueStore.list({ appId }));
  }

  async function announce({ sent = 0 } = {}) {
    const summary = await get();
    triggerAppEvent({ name: 'onRequestQueue', event: { ...summary, sent } });
    return summary;
  }

  async function enqueue({ body, buildId, pageId, requestId, url }) {
    const id = newId();
    await queueStore.add({
      appId,
      item: { body, buildId, id, pageId, queuedAt: new Date().toISOString(), requestId, url },
    });
    await announce();
    return { response: { queued: true, id, message: QUEUED_MESSAGE } };
  }

  // Sends one item. 'sent', 'failed', or 'stop' (no network, or the session ended).
  async function sendItem(item) {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthorizationHeaders({ host: { authTransport: 'bearer', tokenStore } }),
    };
    if (item.buildId !== null) {
      headers['x-lowdefy-build'] = item.buildId;
    }
    let res;
    try {
      // keepBuild: the item's build is checked, not replaced by the build the shell holds now.
      res = await fetch(item.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(item.body),
        keepBuild: true,
      });
    } catch (error) {
      if (isNetworkError(error)) return 'stop';
      throw error;
    }
    if (res.ok) {
      await queueStore.remove({ id: item.id });
      return 'sent';
    }
    if (res.status === 401) {
      return 'stop';
    }
    await queueStore.update({
      id: item.id,
      status: 'failed',
      error: await readError(res),
      attempts: item.attempts + 1,
    });
    return 'failed';
  }

  async function runReplay() {
    let sent = 0;
    let changed = false;
    const items = await queueStore.list({ appId });
    for (const item of items.filter((entry) => entry.status === 'pending')) {
      if (!networkStatus.isOnline()) break;
      const result = await sendItem(item);
      if (result === 'stop') break;
      changed = true;
      if (result === 'sent') sent += 1;
    }
    if (changed) {
      await announce({ sent });
    }
  }

  // One replay at a time; a replay asked for while one runs waits for it.
  function replay() {
    if (replaying === null) {
      replaying = runReplay().finally(() => {
        replaying = null;
      });
    }
    return replaying;
  }

  async function send({ body, buildId, pageId, requestId, send: sendNow, url }) {
    const waiting = (await get()).pending > 0;
    if (!networkStatus.isOnline() || waiting) {
      const queued = await enqueue({ body, buildId, pageId, requestId, url });
      if (networkStatus.isOnline()) replay();
      return queued;
    }
    try {
      return await sendNow();
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      return enqueue({ body, buildId, pageId, requestId, url });
    }
  }

  async function retry({ id } = {}) {
    const items = await queueStore.list({ appId });
    for (const item of items) {
      if (item.status === 'failed' && (id === undefined || item.id === id)) {
        await queueStore.update({ id: item.id, status: 'pending', attempts: item.attempts });
      }
    }
    await replay();
    return announce();
  }

  async function discard({ failed, id } = {}) {
    if (failed === true) {
      await queueStore.removeFailed({ appId });
    } else if (typeof id === 'string') {
      await queueStore.remove({ id });
    } else {
      throw new Error('DiscardQueuedRequest requires "id", or "failed: true".');
    }
    return announce();
  }

  // Replays at launch and whenever the shell comes back online. Returns the function that stops it.
  function start() {
    replay().catch(() => {});
    return networkStatus.subscribe((online) => {
      if (online) replay().catch(() => {});
    });
  }

  return { discard, get, replay, retry, send, start };
}

export default createRequestQueue;
