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

import { ServerParser } from '@lowdefy/operators';
import { _app, _secret } from '@lowdefy/operators-js/operators/server';

import createAdapter from './createAdapter.js';
import createCallbacks from './callbacks/createCallbacks.js';
import createEvents from './events/createEvents.js';
import createLogger from './createLogger.js';
import createProviders from './createProviders.js';

const authConfigCache = {};
let initialized = false;

function getAuthConfig({ appMeta, authJson, logger, plugins, secrets }) {
  if (initialized) return authConfigCache;

  const operatorsParser = new ServerParser({
    lowdefyApp: appMeta,
    operators: { _app, _secret },
    secrets,
    user: {},
  });

  const { output: authConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
    payload: {},
  });

  if (operatorErrors.length > 0) {
    throw operatorErrors[0];
  }

  authConfigCache.adapter = createAdapter({ authConfig, logger, plugins });
  authConfigCache.callbacks = createCallbacks({ authConfig, logger, plugins });
  authConfigCache.events = createEvents({ authConfig, logger, plugins });
  authConfigCache.logger = createLogger({ logger });
  authConfigCache.providers = createProviders({ authConfig, logger, plugins });
  authConfigCache.debug = authConfig.debug ?? logger?.isLevelEnabled('debug') === true;
  authConfigCache.pages = authConfig.authPages;
  authConfigCache.session = authConfig.session;
  authConfigCache.theme = authConfig.theme;
  authConfigCache.cookies = authConfig?.advanced?.cookies;
  // Auth.js v5 reads AUTH_SECRET from env but not NEXTAUTH_SECRET — map the
  // v4 variable here so existing deployments keep working without env changes.
  authConfigCache.secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  // Self-hosted servers run behind arbitrary proxies; derive URLs from request
  // headers (v4 derived them from NEXTAUTH_URL, aliased to AUTH_URL at startup).
  authConfigCache.trustHost = true;
  authConfigCache.basePath = '/api/auth';
  initialized = true;
  return authConfigCache;
}

export default getAuthConfig;
