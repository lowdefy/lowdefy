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

import {
  createPairingBuffer,
  createPasswordRedactor,
  createRecordBatcher,
  createRecordingSession,
  sendRecords,
} from '@lowdefy/client-core';
import { describeBlock } from '@lowdefy/client-native';
import { getTrace } from '@lowdefy/engine';
import { type } from '@lowdefy/helpers';

import getShownPage from '../tab/getShownPage.js';

const PAGE_CHECK_MS = 500;

// A TextInput of type password draws a secure field; its value is never recorded.
function isPasswordBlock(block) {
  return block?.eval?.properties?.type === 'password';
}

function findBlock({ blockId, lowdefy, page }) {
  return (
    lowdefy.contexts?.[page?.instanceKey]?._internal.RootSlots?.map?.[blockId] ??
    lowdefy.appContext?._internal.RootSlots?.map?.[blockId] ??
    null
  );
}

function currentUrl(lowdefy) {
  const { location } = lowdefy._internal.globals.window;
  return `${location.pathname}${location.search}`;
}

// The device store as the sessionStorage the recording session keeps its id in, so a session lasts
// across reloads and a restart of the app within 10 minutes.
function createSessionStorage(kv) {
  return {
    getItem: (key) => kv.get(key) ?? null,
    setItem: (key, value) => kv.set(key, value),
  };
}

/**
 * Lowdefy Dev's recorder: what a developer does on the phone, written as the web recorder writes
 * it (server-dev client/recorder/createRecorder.js), so `lowdefy journeys session` and the
 * journeys-from-dev skill read phone sessions as they read browser ones.
 *
 * - The engine trace's interactions (client-native reports presses and changes by block id) pair
 *   with its completed events through the shared pairing buffer (@lowdefy/client-core).
 * - A pageview is recorded when the page on screen changes, checked every 500 ms and before each
 *   interaction and event.
 * - Targets are block ids (client-native describeBlock). Password inputs are redacted.
 * - Each record is labelled with the device (`ios` or `android`) and the shell's version, and
 *   batches are posted to the dev server's /api/dev-recording.
 * - A reload of the app makes a new lowdefy object: the recorder follows it.
 *
 * @param {Object} params
 * @param {string} params.apiBase The dev server's URL.
 * @param {string} params.device 'ios' or 'android'.
 * @param {Function} params.fetch The Fetch API, with the pairing and shell headers.
 * @param {() => string|null} params.getBuild The build of the root the shell holds.
 * @param {() => Object|null} params.getLowdefy The open app's lowdefy object.
 * @param {Object} params.kv The device store.
 * @param {string} params.shellVersion
 * @param {() => number} [params.now]
 */
function createNativeRecorder({
  apiBase,
  device,
  fetch,
  getBuild,
  getLowdefy,
  kv,
  now = Date.now,
  shellVersion,
}) {
  const session = createRecordingSession({ storage: createSessionStorage(kv), now });
  const batcher = createRecordBatcher({
    send: (records) => sendRecords({ basePath: apiBase, records, fetch }),
  });
  let lowdefy = null;
  let detach = () => undefined;
  let shown = null;
  let timer = null;

  const buffer = createPairingBuffer({
    onRecord: (record) => batcher.add({ ...record, device, shell_version: shellVersion }),
    now,
    getSession: () => session.getId(),
    getRoles: () => lowdefy?.user?.roles ?? [],
    getBuild,
    redactor: createPasswordRedactor({ isPassword: isPasswordBlock }),
  });

  // Records a pageview when the page instance on screen changed. `t` places it before the
  // interaction or event that found the change, which happened on the new page.
  function checkPage({ t } = {}) {
    if (lowdefy === null) return;
    const page = getShownPage(lowdefy);
    if (page === null || page.instanceKey === shown?.instanceKey) return;
    shown = page;
    buffer.addInteraction({
      t: t ?? now(),
      kind: 'pageview',
      pageId: page.pageId,
      pathParams: page.pathParams,
      url: currentUrl(lowdefy),
    });
  }

  function onInteraction(interaction) {
    try {
      checkPage({ t: interaction.t - 1 });
      const target = describeBlock({ blockId: interaction.blockId, lowdefy });
      buffer.addInteraction({
        t: interaction.t,
        kind: interaction.kind,
        element: findBlock({ blockId: interaction.blockId, lowdefy, page: shown }),
        target,
        pageId: target.page_id ?? shown?.pageId,
        value: interaction.value,
        key: interaction.key,
      });
    } catch (error) {
      // Recording is best effort: it never gets in the app's way.
    }
  }

  function onTrace(payload) {
    try {
      checkPage();
      buffer.addEvent(payload, { urlAfter: currentUrl(lowdefy) });
    } catch (error) {
      // Recording is best effort.
    }
  }

  function flush() {
    try {
      buffer.flushAll();
      return batcher.flush();
    } catch (error) {
      return Promise.resolve();
    }
  }

  // Follows the open app's lowdefy object, which a reload replaces.
  function follow() {
    const next = getLowdefy();
    if (next === lowdefy) {
      checkPage();
      return;
    }
    detach();
    flush();
    lowdefy = next;
    shown = null;
    if (type.isNone(lowdefy)) {
      lowdefy = null;
      detach = () => undefined;
      return;
    }
    const trace = getTrace(lowdefy);
    const unsubscribeEvents = trace.subscribe(onTrace, { state: true });
    const unsubscribeInteractions = trace.subscribeInteractions(onInteraction);
    detach = () => {
      unsubscribeEvents();
      unsubscribeInteractions();
    };
    checkPage();
  }

  function start() {
    follow();
    timer = setInterval(follow, PAGE_CHECK_MS);
  }

  function stop() {
    clearInterval(timer);
    detach();
    detach = () => undefined;
    return flush();
  }

  return { flush, start, stop };
}

export default createNativeRecorder;
