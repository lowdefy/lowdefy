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
import { createApiContext } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../../lib/build/appMeta.js';
import config from '../../lib/build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from '../../lib/server/log/createHandleError.js';
import createLogger from '../../lib/server/log/createLogger.js';
import fileCache from '../../lib/server/fileCache.js';
import getDevState from '../../lib/server/devState.js';
import getServerJsMap from '../../lib/server/getServerJsMap.js';
import getSession from '../../lib/server/auth/session.js';
import i18nConfig from '../../lib/build/i18n.js';
import logRequest from '../../lib/server/log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';

const secrets = getSecretsFromEnv();

// Replaces lib/server/apiWrapper.js. Errors thrown by handlers are routed by
// Hono to the app-level error handler (src/middleware/errorHandler.js).
function apiContext() {
  return async function apiContextMiddleware(c, next) {
    if (c.get('lowdefyContext')) {
      return next();
    }
    const buildDirectory = path.join(process.cwd(), 'build');
    // Live server jsMap from the shared build context — JIT page builds add
    // content-hashed _js entries in memory (replaces the previous mtime-gated
    // re-eval of serverJsMap.js from disk).
    const jsMap = getServerJsMap();

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
    };
    context.logger = createLogger();
    context.handleError = createHandleError({ context });
    if (!c.req.path.includes('/api/auth')) {
      context.session = await getSession(c);
    }
    createApiContext(context);
    // keyMap/refMap live in the shared build context — error location
    // resolution reads them from memory (the per-JIT-build writeMaps disk
    // write is gone). Everything else still reads the written artifacts.
    const readConfigFile = context.readConfigFile;
    const buildContext = getDevState().buildContext;
    context.readConfigFile = async (filePath) => {
      if (filePath === 'keyMap.json') return buildContext.keyMap;
      if (filePath === 'refMap.json') return buildContext.refMap;
      return readConfigFile(filePath);
    };
    logRequest({ context });
    c.set('lowdefyContext', context);
    return next();
  };
}

export default apiContext;
