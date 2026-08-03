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

import path from 'node:path';
import { createApiContext, normalizeInjectedCaller } from '@lowdefy/api';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../../lib/build/appMeta.js';
import authJson from '../../lib/build/auth.js';
import config from '../../lib/build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from '../../lib/server/log/createHandleError.js';
import createLogger from '../../lib/server/log/createLogger.js';
import fileCache from '../../lib/server/fileCache.js';
import getE2eSecrets from '../../lib/server/getE2eSecrets.js';
import getUser from '../../lib/server/auth/getUser.js';
import i18nConfig from '../../lib/build/i18n.js';
import jsMap from '../../build/plugins/operators/serverJsMap.js';
import logRequest from '../../lib/server/log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';
import steps from '../../build/plugins/steps.js';
import websockets from '../../build/plugins/websockets.js';

const secrets = getE2eSecrets();

// Replaces lib/server/apiWrapper.js. Builds the request context consumed by
// @lowdefy/api functions. Errors thrown by handlers are routed by Hono to the
// app-level error handler (src/middleware/errorHandler.js), which reads this
// context back from the Hono context.
function apiContext() {
  return async function apiContextMiddleware(c, next) {
    // The page-route mount ('/*') also matches /api/* paths that already
    // built a context — never build twice for one request.
    if (c.get('lowdefyContext')) {
      return next();
    }
    const rid = uuid();
    const context = {
      rid,
      agents,
      appMeta,
      buildDirectory: path.join(process.cwd(), 'build'),
      config,
      configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd(),
      connections,
      fileCache,
      headers: c.req.header(),
      i18n: i18nConfig,
      jsMap,
      logger: createLogger({ rid }),
      operators,
      req: {
        url: c.req.path,
        method: c.req.method,
        hostname: c.req.header('host'),
      },
      secrets,
      steps,
      websockets,
    };
    context.handleError = createHandleError({ context });
    // The cookie user is a pre-resolved caller substituting for
    // resolveAuthentication - normalizeInjectedCaller floors it to the
    // resolved-caller shape. An absent cookie stays a logged-out (null) caller.
    const user = getUser(c);
    context.user = user ? normalizeInjectedCaller(user) : null;
    createApiContext(context);
    // No auth engine runs in the e2e server, so createApiContext retains no
    // organization binding. Derive the policy from the built auth config so
    // the tenant wall's policy gate still engages for a tenant app; pinned
    // stays null (no engine means no seeded organization row).
    if (authJson.organizations) {
      context.organization = { policy: authJson.organizations.policy, pinned: null };
    }
    logRequest({ context });
    c.set('lowdefyContext', context);
    return next();
  };
}

export default apiContext;
