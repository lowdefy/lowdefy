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
import fs from 'node:fs';

import chokidar from 'chokidar';
import { streamSSE } from 'hono/streaming';

import pollTab from '../../lib/docs/pollTab.js';
import { registerTab, unregisterTab } from '../../lib/docs/tabChannel.js';
import { remoteCallerHeader } from '../../lib/server/pairingHeaders.js';
import readRecordingCookie from '../../lib/server/recording/readRecordingCookie.js';

const PLATFORMS = ['ios', 'android'];

// A phone shell (Lowdefy Dev) names its shell version in x-lowdefy-shell, and
// its platform and bundle id in the query; the manager's proxy marks a phone
// paired over the network (remoteCallerHeader). A browser tab is no device.
function tabDevice(c) {
  const shell = c.req.header('x-lowdefy-shell');
  if (shell === undefined) {
    return null;
  }
  const platform = c.req.query('platform');
  return {
    shell,
    platform: PLATFORMS.includes(platform) ? platform : null,
    app: c.req.query('app') ?? null,
    paired: c.req.header(remoteCallerHeader) !== undefined,
  };
}

// A verified recording cookie means the dev server's own headless browser
// opened the tab: a journey run ({ source }), or a headless
// tool ('off'). A developer's tab carries none.
function tabOrigin(c) {
  const device = tabDevice(c);
  const recording = readRecordingCookie(c.req.header('cookie'));
  if (recording === null) {
    return { source: 'dev', automated: false, device };
  }
  if (recording === 'off') {
    return { source: 'headless', automated: true, device };
  }
  return { source: recording.source, automated: true, device };
}

// Every tab's stream shares one watcher on build/reload: a watcher per
// connection held one fs handle per open tab, headless journey and screenshot
// tabs included. Same shape as lib/docs/devEventBus.js.
const subscribers = new Set();

let watcher = null;

function notifySubscribers() {
  [...subscribers].forEach((notify) => notify());
}

function startWatcher() {
  watcher = chokidar.watch(['./build/reload'], {
    persistent: true,
    ignoreInitial: true,
  });
  watcher.on('add', notifySubscribers);
  watcher.on('change', notifySubscribers);
  // Do not reload on unlink — cleanBuildDirectory deletes build/reload during
  // skeleton rebuilds, which would send a premature SSE event before the new
  // build artifacts are written. The real reload comes via add/change when
  // reloadClients() creates the file after the build completes.
}

// The close waits until the event being handled is done, for the reason
// devEventBus.js gives: chokidar 4 registers a new file's watch handle only
// after its add event returns, so a close made inside it would leave that
// handle open for the next watcher of build/reload to share.
function stopWatcher() {
  const stopping = watcher;
  watcher = null;
  return new Promise((resolve) => setImmediate(resolve)).then(() => stopping.close());
}

function subscribeToReload(notify) {
  subscribers.add(notify);
  if (watcher === null) {
    startWatcher();
  }
  return () => {
    if (!subscribers.delete(notify)) return;
    if (subscribers.size === 0 && watcher !== null) {
      stopWatcher();
    }
  };
}

// SSE endpoint — notifies the client when build/reload is written so it can
// mutate the SWR cache and refetch config. Also doubles as the transport for
// the agent-state-xray tab channel (lib/docs/tabChannel.js): every
// connection is a browser tab (client/Reload.jsx opens exactly one per tab),
// so each is registered as an inspectable dev tab and told its id in a `tab`
// event, after which an agent can push it inspect-request/eval-request
// events on the same stream.
//
// One stream per tab is deliberate: dev serves over HTTP/1.1, where browsers
// allow six connections per host, and an open event stream holds one for the
// life of the tab. The tab's page is not carried on this connection — it
// would force a reconnect on every navigation — but posted by
// client/Inspector.jsx to /api/dev-inspect/page (routes/devInspect.js) as
// { tabId, pageId } whenever it changes.
function readReloadStamp() {
  try {
    return fs.readFileSync('./build/reload', 'utf8');
  } catch {
    // No build has finished since the build directory was cleaned.
    return null;
  }
}

// GET /api/reload?transport=poll[&tabId=<id>] is the same channel for a tab
// that cannot read an event stream (a phone shell whose fetch cannot stream):
// it answers { tabId, events } with the events queued since the last poll
// (lib/docs/pollTab.js).
async function reloadHandler(c) {
  if (c.req.query('transport') === 'poll') {
    return c.json(
      pollTab({
        tabId: c.req.query('tabId'),
        origin: tabOrigin(c),
        readReloadStamp,
      })
    );
  }
  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribeToReload(() => {
      stream.writeSSE({ event: 'reload', data: JSON.stringify({}) });
    });

    const tabId = randomUUID();
    registerTab({
      id: tabId,
      send: (event, data) => stream.writeSSE({ event, data: JSON.stringify(data) }),
      ...tabOrigin(c),
    });

    let open = true;
    stream.onAbort(() => {
      open = false;
      unsubscribe();
      unregisterTab({ id: tabId });
    });

    await stream.writeSSE({ event: 'tab', data: JSON.stringify({ tabId }) });

    while (open) {
      await stream.sleep(15000);
      if (open) {
        await stream.writeSSE({ event: 'ping', data: '' });
      }
    }
  });
}

export default reloadHandler;
