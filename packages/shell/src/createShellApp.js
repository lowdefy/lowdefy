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

import { openDatabaseSync } from 'expo-sqlite';

import createAppSession from './session/createAppSession.js';
import createDeviceStore from './host/createDeviceStore.js';
import createRouterAdapter from './host/createRouterAdapter.js';
import createShellFetch from './host/createShellFetch.js';
import createShellHost from './host/createShellHost.js';
import createShellLocale from './locale/createShellLocale.js';
import createSqliteCacheStore from './cache/createSqliteCacheStore.js';
import createTokenStore from './host/createTokenStore.js';
import getAppApiBase from './config/getAppApiBase.js';
import getDeviceLocales from './locale/getDeviceLocales.js';
import withShellHeader from './host/withShellHeader.js';

let db = null;

function getDatabase() {
  if (db === null) {
    db = openDatabaseSync('lowdefy-shell.db');
  }
  return db;
}

// Everything one app needs in the shell: its session, core host and locale. The token is read from the
// Keychain or Keystore before the session starts.
async function createShellApp({ app, shell }) {
  const tokenStore = createTokenStore({ appId: app.id });
  await tokenStore.load();
  const fetch = withShellHeader({ fetch: globalThis.fetch, shellVersion: shell.version });
  const session = createAppSession({
    apiBase: getAppApiBase({ app, environment: shell.environment }),
    app,
    cacheStore: createSqliteCacheStore({ db: getDatabase() }),
    fetch,
    kv: createDeviceStore(),
    tokenStore,
  });
  const host = createShellHost({
    fetch: createShellFetch({ fetch, session }),
    router: createRouterAdapter({ session }),
    session,
    tokenStore,
  });
  const locale = createShellLocale({
    getDeviceLocales,
    globals: host.globals,
    session,
    storage: host.storage,
  });
  return { host, locale, session };
}

export default createShellApp;
