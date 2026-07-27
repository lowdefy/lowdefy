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
import appMeta from '../build/appMeta.js';
import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from './log/createHandleError.js';
import createJsMapLoader from './createJsMapLoader.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getReport from './getReport.js';
import getSession from './auth/session.js';
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
const loadDynamicJsMap = createJsMapLoader({
  artifact: 'serverJsMap.js',
  staticJsMap,
});

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
  // Lazy, because this context is built in middleware — before a route has had a
  // chance to JIT-build the page it is about to render, and that build is what
  // writes the artifacts the seam reads (the page's _js functions, its block
  // metas, its Tailwind classes). Read eagerly, the first report for a
  // never-opened page renders against artifacts that predate it: charts come out
  // empty and tiles unstyled, and only the second request looks right. A getter
  // means no dev route can get this ordering wrong; the reads inside are
  // mtime-cached, so repeat access is a few stat calls.
  Object.defineProperty(context, 'report', {
    enumerable: true,
    get: () => getReport({ buildDirectory }),
  });

  context.logger = createLogger();
  context.handleError = createHandleError({ context });
  if (!c.req.path.includes('/api/auth')) {
    context.session = await getSession(c);
  }
  createApiContext(context);
  logRequest({ context });
  return context;
}

export default createLowdefyContext;
