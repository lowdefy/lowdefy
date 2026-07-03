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
import { createApiContext, resolveAuthentication } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../../lib/build/appMeta.js';
import config from '../../lib/build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from '../../lib/server/log/createHandleError.js';
import createLogger from '../../lib/server/log/createLogger.js';
import fileCache from '../../lib/server/fileCache.js';
import getAuth from '../../lib/server/auth/getAuth.js';
import getMockUser from '../../lib/server/auth/getMockUser.js';
import getStrategies from '../../lib/server/auth/getStrategies.js';
import i18nConfig from '../../lib/build/i18n.js';
import loadDynamicJsMap from '../../lib/server/loadDynamicJsMap.js';
import logRequest from '../../lib/server/log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';
import steps from '../../build/plugins/steps.js';
import websockets from '../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Replaces lib/server/apiWrapper.js. Errors thrown by handlers are routed by
// Hono to the app-level error handler (src/middleware/errorHandler.js).
function apiContext() {
  return async function apiContextMiddleware(c, next) {
    if (c.get('lowdefyContext')) {
      return next();
    }
    const buildDirectory = path.join(process.cwd(), 'build');
    const jsMap = loadDynamicJsMap(buildDirectory);

    const context = {
      rid: uuid(),
      agents,
      appMeta,
      buildDirectory,
      configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd(),
      config,
      connections,
      fileCache,
      headers: c.req.header(),
      i18n: i18nConfig,
      jsMap,
      handleError: async (err) => {
        console.error(err);
      },
      logger: console,
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
    context.logger = createLogger();
    context.handleError = createHandleError({ context });
    // Hoisted once per request - resolveAuthentication also needs it, and
    // getBetterAuth memoizes the instance, but this keeps the auth engine
    // construction to a single call site per request.
    context.auth = getAuth({ logger: context.logger });
    if (!c.req.path.includes('/api/auth')) {
      const mockUser = getMockUser();
      if (mockUser) {
        // The mock user is a pre-resolved caller - it substitutes for the
        // whole resolveAuthentication step and its roles are authoritative.
        context.user = mockUser;
      } else {
        // resolveAuthentication is the single writer of context.user.
        await resolveAuthentication(context, {
          auth: context.auth,
          headers: c.req.raw.headers,
          strategies: getStrategies({ logger: context.logger }),
        });
      }
    }
    createApiContext(context);
    logRequest({ context });
    c.set('lowdefyContext', context);
    return next();
  };
}

export default apiContext;
