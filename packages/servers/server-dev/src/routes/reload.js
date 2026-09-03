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

import chokidar from 'chokidar';
import { streamSSE } from 'hono/streaming';

import { subscribe } from '../../lib/docs/devEventBus.js';
import { registerTab, unregisterTab } from '../../lib/docs/tabChannel.js';

// SSE endpoint — notifies the client when build/reload is written so it can
// mutate the SWR cache and refetch config. Also doubles as the transport for
// the agent-state-xray tab channel (lib/docs/tabChannel.js): a connection
// that includes ?pageId=<id> is registered as an inspectable dev tab so an
// agent can push it inspect-request/eval-request SSE events. Every stream
// also carries dev notices (the dev_notice event on lib/docs/devEventBus.js)
// as `dev-notice` events, which Reload.jsx hands to the ErrorBar.
//
// pageId tracking design: Inspector.jsx (not Reload.jsx) owns this query
// param, and re-opens its EventSource — new connection, new tab id — every
// time the developer navigates to a different page. That keeps tabChannel's
// view of "what page is this tab on" always correct without a separate
// ping route: Reload.jsx's own connection never sends pageId, so it is never
// registered as a tab and can't be mistaken for one by requestFromTab.
async function reloadHandler(c) {
  return streamSSE(c, async (stream) => {
    const watcher = chokidar.watch(['./build/reload'], {
      persistent: true,
      ignoreInitial: true,
    });

    const pageId = c.req.query('pageId');
    const tabId = pageId === undefined ? undefined : randomUUID();
    if (tabId) {
      registerTab({
        id: tabId,
        pageId,
        send: (event, data) => stream.writeSSE({ event, data: JSON.stringify(data) }),
      });
    }

    // The bus carries every dev event; this stream is the browser's, and the
    // ErrorBar only renders notices - build and error events reach it through
    // the page's own runtime error channel.
    const unsubscribeNotices = subscribe((event) => {
      if (event.type !== 'dev_notice') return;
      return stream.writeSSE({ event: 'dev-notice', data: JSON.stringify(event) });
    });

    let open = true;
    stream.onAbort(() => {
      open = false;
      watcher.close();
      unsubscribeNotices();
      if (tabId) {
        unregisterTab({ id: tabId });
      }
    });

    const reload = () => {
      stream.writeSSE({ event: 'reload', data: JSON.stringify({}) });
    };
    watcher.on('add', () => reload());
    watcher.on('change', () => reload());
    // Do not reload on unlink — cleanBuildDirectory deletes build/reload during
    // skeleton rebuilds, which would send a premature SSE event before the new
    // build artifacts are written. The real reload comes via add/change when
    // reloadClients() creates the file after the build completes.

    while (open) {
      await stream.sleep(15000);
      if (open) {
        await stream.writeSSE({ event: 'ping', data: '' });
      }
    }
  });
}

export default reloadHandler;
