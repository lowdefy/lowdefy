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

import crypto from 'node:crypto';

import { type } from '@lowdefy/helpers';

import createFaultSink from './createFaultSink.js';
import createSessionConnections from './createSessionConnections.js';
import { applyDataSetRedirect, trackSessionWork } from './dataSets/index.js';

// The API context of one call under a session, with the fields the production server's request
// middleware sets (packages/servers/server/src/middleware/apiContext.js): mode prod, and the
// real plugin maps and config of the build. What differs is what a test must not reach or does
// not have:
// - The caller is injected, as a journey's user is. No auth engine runs, so auth steps fail,
//   and createInjectedApiContext takes the organization policy and the gate's enforcement
//   facts from the built auth.json, which keeps the tenant wall up.
// - Connections go through the data session's gate and sink, as under a journey.
// - agents is empty, the secrets are the test secrets, and there is no origin, so a detached
//   CallApi has nowhere to send its loopback request even if CRON_SECRET were set.
// - waitUntil tracks background work on the session, so session.settled() can wait for it.
// - handleError lists faults on the call's answer; the logger is silent.
// `user` is the caller's user object, or null for a signed out caller.
function createCallContext({ faults, req, testSession, user }) {
  const { runtime, testApp } = testSession;
  const { session } = testSession.dataSession;
  const { createInjectedApiContext, normalizeInjectedCaller } = testApp.modules.api;
  const context = {
    rid: crypto.randomUUID(),
    agents: runtime.agents,
    appMeta: testApp.appMeta,
    auth: null,
    buildDirectory: testApp.directories.build,
    config: runtime.config,
    connections: runtime.connections,
    fileCache: testApp.fileCache,
    headers: {},
    i18n: runtime.i18n,
    interpolateProperties: runtime.interpolateProperties,
    jsMap: runtime.jsMap,
    logger: runtime.logger,
    mode: 'prod',
    notifications: runtime.notifications,
    operators: runtime.operators,
    renderEmail: runtime.renderEmail,
    req,
    scrubSecrets: runtime.scrubSecrets,
    secrets: runtime.secrets,
    steps: runtime.steps,
    user: type.isNone(user) ? null : normalizeInjectedCaller(user),
    websockets: runtime.websockets,
  };
  context.handleError = createFaultSink({ context, faults, testApp });
  createInjectedApiContext(context, { authJson: testApp.authJson });
  const { gate, resolvers } = createSessionConnections({ context, testSession });
  applyDataSetRedirect({ context, session, connections: gate });
  context.connections = resolvers;
  context.dataSet = session.name;
  context.waitUntil = trackSessionWork({ session });
  return context;
}

export default createCallContext;
