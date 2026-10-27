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

import { type } from '@lowdefy/helpers';
import devPassiveHeader from '@lowdefy/node-utils/devPassiveHeader.js';

import answerEval from './answerEval.js';
import answerInspect from './answerInspect.js';
import DEV_CLIENT_MARKER from './devClientMarker.js';
import describeTabError from './describeTabError.js';
import getShownPage from './getShownPage.js';
import readEventStream from './readEventStream.js';

const FIRST_EVENT_MS = 5000;
const RECONNECT_MS = 1000;
const PAGE_CHECK_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The phone's platform and app id ride on every registration, so the dev server's device tools
// know a simulator from an Android device (server-dev src/routes/reload.js).
function deviceQuery(device) {
  const params = new URLSearchParams({ client: DEV_CLIENT_MARKER });
  if (type.isString(device?.platform)) {
    params.set('platform', device.platform);
  }
  if (type.isString(device?.app)) {
    params.set('app', device.app);
  }
  return params.toString();
}

// The instance a request names (the dev server picks it), else the one on screen.
function requestedPage({ request, shownPage }) {
  if (type.isString(request.instanceKey)) {
    return {
      pageId: request.pageId,
      pathParams: request.pathParams,
      instanceKey: request.instanceKey,
    };
  }
  return shownPage;
}

/**
 * Lowdefy Dev's dev-tab client: the shell joins the dev server's tab channel as a browser tab does
 * (server-dev src/routes/reload.js, lib/docs/tabChannel.js, src/routes/devInspect.js), so agents
 * reach it with the tools they use on a browser tab.
 *
 * - It registers on /api/reload, reading the event stream from a streaming fetch body. When the
 *   stream cannot be read (no `tab` event within 5 s), it polls /api/reload?transport=poll every
 *   second instead.
 * - It posts the page instance on screen to /api/dev-inspect/page whenever it changes.
 * - It names the phone's platform and app id (`device`) when it registers, for the device tools.
 * - `reload` runs onReload. `inspect-request` and `eval-request` are answered on /api/dev-inspect
 *   with the payloads a browser tab posts; `step-request` runs a journey step (onStep), and
 *   `inject` fakes the next device result (onInject: `{ requestId, inject: { kind, value, name } }`).
 *
 * @param {Object} params
 * @param {string} params.apiBase The dev server's URL.
 * @param {{ platform: string, app: string }} [params.device] The phone's platform ('ios' or
 *   'android') and app id (bundle id or package).
 * @param {Function} params.fetch The Fetch API for posts and polls (pairing and shell headers).
 * @param {Function} params.streamFetch A Fetch API whose response body streams (expo/fetch), with
 *   the same headers.
 * @param {() => Object|null} params.getLowdefy The open app's lowdefy object.
 * @param {() => Promise} params.onReload
 * @param {({ injection }) => Object} params.onInject
 * @param {({ step, page }) => Promise<Object>} params.onStep
 * @param {(message: string) => void} [params.log]
 * @param {number} [params.pollInterval] Ms between polls.
 */
function createDevTabClient({
  apiBase,
  device,
  fetch,
  getLowdefy,
  log = () => undefined,
  onInject,
  onReload,
  onStep,
  pollInterval = 1000,
  streamFetch,
}) {
  let stopped = false;
  let tabId = null;
  let postedPage = null;
  let streamAbort = null;
  let pageTimer = null;

  async function post(path, body) {
    try {
      await fetch(`${apiBase}/api/dev-inspect${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      // A failed answer leaves the agent's request to time out on the server.
      log(`Dev tab: could not reach the dev server (${error.message}).`);
    }
  }

  function postShownPage() {
    const page = getShownPage(getLowdefy());
    if (tabId === null || page === null) {
      return;
    }
    const key = `${tabId}|${page.instanceKey}`;
    if (key === postedPage) {
      return;
    }
    postedPage = key;
    post('/page', { tabId, ...page });
  }

  async function respond({ event, request }) {
    const lowdefy = getLowdefy();
    const page = requestedPage({ request, shownPage: getShownPage(lowdefy) });
    if (event === 'inspect-request') {
      return answerInspect({ lowdefy, page });
    }
    if (event === 'eval-request') {
      return answerEval({ expression: request.expression, lowdefy, page });
    }
    if (event === 'inject') {
      return onInject({ injection: request.inject });
    }
    return onStep({ step: request.step, page });
  }

  async function answer({ event, data }) {
    let requestId;
    try {
      const request = JSON.parse(data);
      requestId = request.requestId;
      const result = await respond({ event, request });
      await post('', { requestId, result });
    } catch (error) {
      await post('', { requestId, result: { error: describeTabError(error) } });
    }
  }

  async function handleEvent({ event, data }) {
    switch (event) {
      case 'tab':
        tabId = JSON.parse(data).tabId;
        postedPage = null;
        log(`Dev tab: joined the dev server as tab ${tabId}.`);
        postShownPage();
        return;
      case 'reload':
        log('Dev tab: the dev server rebuilt the app; reloading.');
        await onReload();
        return;
      case 'inspect-request':
      case 'eval-request':
      case 'step-request':
      case 'inject':
        await answer({ event, data });
        return;
      default:
        // ping
        return;
    }
  }

  function dispatch(message) {
    handleEvent(message).catch((error) =>
      log(`Dev tab: ${message.event} failed: ${error.message}`)
    );
  }

  // Resolves 'ended' when an open stream ends (the dev server restarted), 'unreachable' when the
  // server did not answer, and 'unsupported' when no event arrived over a stream that opened.
  async function runStream() {
    let received = false;
    const controller = new AbortController();
    streamAbort = controller;
    const firstEventTimer = setTimeout(() => {
      if (!received) controller.abort();
    }, FIRST_EVENT_MS);
    try {
      const res = await streamFetch(`${apiBase}/api/reload?${deviceQuery(device)}`, {
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (!res.ok) {
        return 'unreachable';
      }
      if (type.isNone(res.body?.getReader)) {
        return 'unsupported';
      }
      await readEventStream({
        body: res.body,
        onEvent: (message) => {
          received = true;
          dispatch(message);
        },
      });
      return 'ended';
    } catch (error) {
      if (received) return 'ended';
      return controller.signal.aborted ? 'unsupported' : 'unreachable';
    } finally {
      clearTimeout(firstEventTimer);
    }
  }

  async function runPolls() {
    while (!stopped) {
      const tabQuery = tabId === null ? '' : `&tabId=${encodeURIComponent(tabId)}`;
      try {
        const res = await fetch(
          `${apiBase}/api/reload?transport=poll&${deviceQuery(device)}${tabQuery}`,
          { headers: { [devPassiveHeader]: '1' } }
        );
        if (res.ok) {
          const { events } = await res.json();
          events.forEach(dispatch);
        }
      } catch (error) {
        // The dev server is restarting: poll again.
      }
      await sleep(pollInterval);
    }
  }

  async function run() {
    while (!stopped) {
      const outcome = await runStream();
      if (stopped) return;
      if (outcome === 'unsupported') {
        log('Dev tab: the event stream could not be read; polling every second.');
        tabId = null;
        await runPolls();
        return;
      }
      await sleep(RECONNECT_MS);
    }
  }

  function start() {
    pageTimer = setInterval(postShownPage, PAGE_CHECK_MS);
    run();
  }

  function stop() {
    stopped = true;
    streamAbort?.abort();
    clearInterval(pageTimer);
  }

  return { getTabId: () => tabId, start, stop };
}

export default createDevTabClient;
