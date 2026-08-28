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

import fs from 'node:fs';
import path from 'node:path';
import { createApiContext } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../build/appMeta.js';
import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from './log/createHandleError.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getSession from './auth/session.js';
import getStrategyCaller from './auth/strategies.js';
import i18nConfig from '../build/i18n.js';
import logRequest from './log/logRequest.js';
import notifications, {
  interpolateProperties,
  renderEmail,
} from '../../build/plugins/notifications.js';
import operators from '../../build/plugins/operators/server.js';
import staticJsMap from '../../build/plugins/operators/serverJsMap.js';
import websockets from '../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Dynamic JS map loading for JIT-built pages — the build rewrites
// serverJsMap.js when a JIT page discovers new _js operators.
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

// Builds the per-request lowdefy API context (connections, secrets,
// operators, logger, session, etc.). Factored out of the /api/* middleware
// (src/middleware/apiContext.js) so run_request (lib/docs/runRequest.js) can
// build an identical context outside the Hono middleware chain, to call
// callRequest directly for agent-driven request execution.
async function createLowdefyContext({ c }) {
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
    // The deployment's own origin — detached endpoint calls loop back
    // through it so the target runs in its own function invocation.
    origin: new URL(c.req.url).origin,
    i18n: i18nConfig,
    interpolateProperties,
    jsMap,
    handleError: async (err) => {
      console.error(err);
    },
    logger: console,
    notifications,
    operators,
    renderEmail,
    req: {
      url: c.req.path,
      method: c.req.method,
      hostname: c.req.header('host'),
    },
    secrets,
    websockets,
  };
  context.logger = createLogger();
  context.handleError = createHandleError({ context });
  if (!c.req.path.includes('/api/auth')) {
    context.session = await getSession(c);
    if (!context.session?.user) {
      const caller = await getStrategyCaller(c, context.logger);
      if (caller) {
        context.session = { user: caller };
      }
    }
  }
  createApiContext(context);
  logRequest({ context });
  return context;
}

export default createLowdefyContext;
