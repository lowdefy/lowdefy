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
import { createApiContext, resolveAuthentication, resolvePinnedOrganization } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../build/appMeta.js';
import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from './log/createHandleError.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getAuth from './auth/getAuth.js';
import getHeadlessSession from './auth/getHeadlessSession.js';
import getMockUser from './auth/getMockUser.js';
import getStrategies from './auth/getStrategies.js';
import i18nConfig from '../build/i18n.js';
import loadDynamicJsMap from './loadDynamicJsMap.js';
import logRequest from './log/logRequest.js';
import notifications, {
  interpolateProperties,
  renderEmail,
} from '../../build/plugins/notifications.js';
import operators from '../../build/plugins/operators/server.js';
import steps from '../../build/plugins/steps.js';
import websockets from '../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Builds the per-request lowdefy API context (connections, secrets,
// operators, logger, resolved user, etc.). Factored out of the /api/*
// middleware (src/middleware/apiContext.js) so run_request
// (lib/docs/runRequest.js) can build an identical context outside the Hono
// middleware chain, to call callRequest directly for agent-driven request
// execution.
async function createLowdefyContext({ c }) {
  const buildDirectory = path.join(process.cwd(), 'build');
  const jsMap = loadDynamicJsMap(buildDirectory);

  const rid = uuid();
  const context = {
    rid,
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
    logger: createLogger({ rid }),
    notifications,
    operators,
    renderEmail,
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
  const mockUser = getMockUser();
  const headlessSession = getHeadlessSession(c);
  if (mockUser) {
    // The mock user is a pre-resolved caller - it substitutes for the
    // whole resolveAuthentication step and its roles are authoritative.
    // No auth engine runs while dev.mockUser is active (see src/app.js),
    // so mock mode never touches the auth database.
    context.auth = null;
    context.user = mockUser;
  } else if (headlessSession) {
    // The headless renderer (docs/MCP screenshot and state tools) injects a
    // user cookie on its own browser context (getBrowser.js), so its /api/*
    // fetches carry a pre-resolved caller and auth-protected pages render.
    // The developer's real browser has no cookie and resolves through the
    // auth engine below, so it is unaffected.
    context.auth = null;
    context.user = headlessSession.user;
  } else {
    // Hoisted once per request - resolveAuthentication also needs it, and
    // getBetterAuth memoizes the instance, but this keeps the auth engine
    // construction to a single call site per request.
    context.auth = getAuth({ logger: context.logger });
    // The engine is constructed lazily on the first request, which would
    // otherwise race the startup pinned-org ensure - await the memoized
    // resolve so createApiContext reads a retained binding.
    await resolvePinnedOrganization({ auth: context.auth, logger: context.logger });
    if (!c.req.path.includes('/api/auth')) {
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
  return context;
}

export default createLowdefyContext;
