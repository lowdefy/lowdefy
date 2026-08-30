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
import {
  createApiContext,
  normalizeInjectedCaller,
  ensureMcpOauthResource,
  resolveAuthentication,
  resolvePinnedOrganization,
  resolveTenantPreflight,
} from '@lowdefy/api';
import { type } from '@lowdefy/helpers';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../build/appMeta.js';
import authJson from '../build/auth.js';
import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from './log/createHandleError.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getAuth from './auth/getAuth.js';
import getHeadlessUser from './auth/getHeadlessUser.js';
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
import resolveHeadlessUser from './auth/resolveHeadlessUser.js';
import steps from '../../build/plugins/steps.js';
import websockets from '../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// The MCP route authenticates by access token alone - the mcp option switches
// resolveAuthentication onto its bearer branch, so it is set only for the MCP
// path. Every other path leaves it false and authentication behaves as before.
function isMcpPath(path) {
  return path.endsWith('/api/mcp');
}

// Builds the per-request lowdefy API context (connections, secrets,
// operators, logger, resolved user, etc.). Factored out of the /api/*
// middleware (src/middleware/apiContext.js) so run_request
// (lib/docs/runRequest.js) can build an identical context outside the Hono
// middleware chain, to call callRequest directly for agent-driven request
// execution. A `user` option injects a per-call caller (agent tools that run
// outside a browser, e.g. run_request), resolved the same way the headless
// renderer's cookie user is.
async function createLowdefyContext({ c, user }) {
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
  const headlessUser = getHeadlessUser(c);
  if (!type.isNone(user)) {
    // An explicit per-call user wins over the ambient auth.dev.mockUser: the
    // caller named an identity for this call, so honour it. Merged over the
    // roleless headless default by resolveHeadlessUser, exactly as the
    // headless page tools' `user` param is.
    context.auth = null;
    context.user = normalizeInjectedCaller(resolveHeadlessUser({ user }));
  } else if (mockUser) {
    // The mock user is a pre-resolved caller - it substitutes for the
    // whole resolveAuthentication step and its roles are authoritative.
    // No auth engine runs while dev.mockUser is active (see src/app.js),
    // so mock mode never touches the auth database. normalizeInjectedCaller
    // floors it to the resolved-caller shape.
    context.auth = null;
    context.user = normalizeInjectedCaller(mockUser);
  } else if (headlessUser) {
    // The headless renderer (docs/MCP screenshot and state tools) injects a
    // user cookie on its own browser context (getBrowser.js), so its /api/*
    // fetches carry a pre-resolved caller and auth-protected pages render.
    // The developer's real browser has no cookie and resolves through the
    // auth engine below, so it is unaffected.
    context.auth = null;
    context.user = normalizeInjectedCaller(headlessUser);
  } else {
    // Hoisted once per request - resolveAuthentication also needs it, and
    // getBetterAuth memoizes the instance, but this keeps the auth engine
    // construction to a single call site per request.
    context.auth = getAuth({ logger: context.logger });
    // The engine is constructed lazily on the first request, which would
    // otherwise race the startup pinned-org ensure - await the memoized
    // resolve so createApiContext reads a retained binding.
    await resolvePinnedOrganization({ auth: context.auth, logger: context.logger });
    // The one oauthResource row the MCP token audience validates against -
    // ensured once per process, memoized like the pinned resolve above; a
    // failure retries on the next request. No-op when the app is not an
    // authorization server.
    await ensureMcpOauthResource({ auth: context.auth, logger: context.logger });
    if (!c.req.path.includes('/api/auth')) {
      // resolveAuthentication is the single writer of context.user.
      await resolveAuthentication(context, {
        auth: context.auth,
        headers: c.req.raw.headers,
        strategies: getStrategies({ logger: context.logger }),
        mcp: isMcpPath(c.req.path),
      });
    }
  }
  createApiContext(context);
  if (!context.auth && authJson.organizations) {
    // Mock and headless callers run no auth engine, so createApiContext
    // retains no organization binding. Derive the policy from the built auth
    // config so the tenant wall's policy gate still engages under
    // policy: tenant (a mock caller there must carry organizationId, or the
    // wall fails closed - loudly, as it should).
    context.organization = { policy: authJson.organizations.policy, pinned: null };
  }
  // Under policy: tenant, refuse to serve while walled collections hold
  // unstamped rows (lazily-run-once; a refusal memoizes until restart, a
  // probe failure retries next request). No-op under pinned.
  await resolveTenantPreflight(context);
  logRequest({ context });
  return context;
}

export default createLowdefyContext;
