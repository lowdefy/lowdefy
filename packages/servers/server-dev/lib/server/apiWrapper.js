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
import fs from 'fs';
import path from 'path';
import { createApiContext } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getServerSession from './auth/getServerSession.js';
import logError from './log/logError.js';
import logRequest from './log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';
import staticJsMap from '../../build/plugins/operators/serverJsMap.js';
import getAuthOptions from './auth/getAuthOptions.js';
import loggerConfig from '../build/logger.js';
import setSentryUser from './sentry/setSentryUser.js';

const secrets = getSecretsFromEnv();

// Dynamic JS map loading for JIT-built pages
let cachedJsMapMtime = null;
let cachedJsMap = staticJsMap;

function loadDynamicJsMap(buildDirectory) {
  const jsMapPath = path.join(buildDirectory, 'plugins', 'operators', 'serverJsMap.js');
  try {
    const stat = fs.statSync(jsMapPath);
    if (cachedJsMapMtime && stat.mtimeMs === cachedJsMapMtime) {
      return cachedJsMap;
    }
    cachedJsMapMtime = stat.mtimeMs;
    // For server-side, we can read and eval the JS file
    const content = fs.readFileSync(jsMapPath, 'utf8');
    const fn = new Function('exports', content.replace('export default', 'exports.default ='));
    const exports = {};
    fn(exports);
    cachedJsMap = { ...staticJsMap, ...(exports.default ?? {}) };
    return cachedJsMap;
  } catch {
    return cachedJsMap;
  }
}

function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const buildDirectory = path.join(process.cwd(), 'build');
    const jsMap = loadDynamicJsMap(buildDirectory);

    const context = {
      // Important to give absolute path so Next can trace build files
      rid: uuid(),
      buildDirectory,
      configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd(),
      config,
      connections,
      fileCache,
      headers: req?.headers,
      jsMap,
      logger: console,
      operators,
      req,
      res,
      secrets,
    };
    try {
      context.logger = createLogger({ rid: context.rid });
      context.authOptions = getAuthOptions(context);
      if (!req.url.startsWith('/api/auth')) {
        context.session = await getServerSession(context);
        // Set Sentry user context for authenticated requests
        setSentryUser({
          user: context.session?.user,
          sentryConfig: loggerConfig.sentry,
        });
      }
      createApiContext(context);
      logRequest({ context });
      // Await here so that if handler throws it is caught.
      const response = await handler({ context, req, res });
      // TODO: Log response time?
      return response;
    } catch (error) {
      await logError({ error, context });
      res.status(500).json({ name: error.name, message: error.message });
    }
  };
}

export default apiWrapper;
