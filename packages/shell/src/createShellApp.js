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

import { fetch as expoFetch } from 'expo/fetch';
import * as Crypto from 'expo-crypto';
import { openDatabaseSync } from 'expo-sqlite';

import createAppAuth from './auth/createAppAuth.js';
import createAppEventTrigger from './native/createAppEventTrigger.js';
import createAppSession from './session/createAppSession.js';
import createDeviceStore from './host/createDeviceStore.js';
import createRouterAdapter from './host/createRouterAdapter.js';
import createShellFetch from './host/createShellFetch.js';
import createShellHost from './host/createShellHost.js';
import createRequestQueue from './queue/createRequestQueue.js';
import createShellLocale from './locale/createShellLocale.js';
import createSqliteCacheStore from './cache/createSqliteCacheStore.js';
import createSqliteQueueStore from './queue/createSqliteQueueStore.js';
import getAppApiBase from './config/getAppApiBase.js';
import getDeviceLocales from './locale/getDeviceLocales.js';
import networkStatus from './host/networkStatus.js';
import withNetworkErrors from './host/withNetworkErrors.js';
import withoutCookies from './auth/withoutCookies.js';
import withShellHeader from './host/withShellHeader.js';

let db = null;

function getDatabase() {
  if (db === null) {
    db = openDatabaseSync('lowdefy-shell.db');
  }
  return db;
}

// Everything the shell's one app (shell.app) needs: its auth, session, core host, locale, request
// queue and the trigger of its app events.
// auth.start reads the session token and starts the session; onSignedOut is called once a sign-out
// removed the person's data, to open the app afresh.
async function createShellApp({ onSignedOut, shell }) {
  const { app } = shell;
  const apiBase = getAppApiBase({ app, environment: shell.environment });
  const cacheStore = createSqliteCacheStore({ db: getDatabase() });
  const queueStore = createSqliteQueueStore({ db: getDatabase() });
  const kv = createDeviceStore();
  // Lowdefy Dev sends a paired dev server's token on every call (src/dev, shell.transport).
  const transport = shell.transport ?? {
    fetch: globalThis.fetch,
    WebSocket: globalThis.WebSocket,
    wrapFetch: (baseFetch) => baseFetch,
  };
  const fetch = withShellHeader({
    fetch: withoutCookies(withNetworkErrors(transport.fetch)),
    shellVersion: shell.version,
  });
  // React Native's fetch buffers a response body; a block that reads its answer as a stream (the
  // AgentChat block's chat stream) calls through expo/fetch, sent the same way.
  const streamFetch = withShellHeader({
    fetch: withoutCookies(withNetworkErrors(transport.wrapFetch(expoFetch))),
    shellVersion: shell.version,
  });

  // Sign-in, unlock and sign-out (src/auth): the token store, the fetches that watch it and the
  // stores a signed-out session can no longer write to.
  const auth = createAppAuth({
    apiBase,
    app,
    cacheStore,
    fetch,
    kv,
    onSignedOut,
    queueStore,
    shell,
    streamFetch,
  });

  const session = createAppSession({
    apiBase,
    app,
    cacheStore: auth.sessionStores.cacheStore,
    fetch: auth.fetch,
    kv: auth.sessionStores.kv,
    tokenStore: auth.tokenStore,
  });
  const shellFetch = createShellFetch({ fetch: auth.fetch, session });
  const triggerAppEvent = createAppEventTrigger({ session });
  const requestQueue = createRequestQueue({
    appId: app.id,
    fetch: shellFetch,
    networkStatus,
    newId: Crypto.randomUUID,
    queueStore,
    tokenStore: auth.tokenStore,
    triggerAppEvent,
  });
  const host = createShellHost({
    fetch: shellFetch,
    requestQueue,
    router: createRouterAdapter({ session }),
    session,
    streamFetch: auth.streamFetch,
    tokenStore: auth.tokenStore,
    WebSocket: transport.WebSocket,
  });
  const locale = createShellLocale({
    getDeviceLocales,
    globals: host.globals,
    session,
    storage: host.storage,
  });
  return { apiBase, auth, host, locale, requestQueue, session, triggerAppEvent };
}

export default createShellApp;
