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
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../../build/plugins/agents.js';
import appMeta from '../../build/appMeta.js';
import config from '../../build/config.js';
import connections from '../../../build/plugins/connections.js';
import createHandleError from '../log/createHandleError.js';
import createLogger from '../log/createLogger.js';
import fileCache from '../fileCache.js';
import i18nConfig from '../../build/i18n.js';
import jsMap from '../../../build/plugins/operators/serverJsMap.js';
import notifications, {
  interpolateProperties,
  renderEmail,
} from '../../../build/plugins/notifications.js';
import operators from '../../../build/plugins/operators/server.js';
import steps from '../../../build/plugins/steps.js';
import websockets from '../../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Builds the per-message context for a channel bot invocation, mirroring the
// apiContext middleware without a Hono request. The caller is the channel's
// service identity - a pre-resolved caller with the configured roles and
// attributes, normalized like the other injected callers. It is NOT a system
// context: authorizeAgent evaluates the agent's auth against this caller.
function createChannelContext({ channelConfig, platform }) {
  const rid = `channel-${platform}-${uuid()}`;
  const context = {
    rid,
    agents,
    appMeta,
    buildDirectory: path.join(process.cwd(), 'build'),
    config,
    connections,
    fileCache,
    headers: {},
    i18n: i18nConfig,
    interpolateProperties,
    jsMap,
    logger: createLogger({ rid }),
    notifications,
    operators,
    renderEmail,
    secrets,
    steps,
    waitUntil: (promise) =>
      globalThis[Symbol.for('@vercel/request-context')]?.get?.()?.waitUntil?.(promise),
    websockets,
  };
  context.handleError = createHandleError({ context });
  // No BetterAuth engine involvement - the caller is injected, same as the
  // dev mock-user path.
  context.auth = null;
  context.user = normalizeInjectedCaller({
    id: `channel:${platform}`,
    sub: `channel:${platform}`,
    authMethod: 'channel',
    roles: channelConfig.roles,
    attributes: channelConfig.attributes,
  });
  createApiContext(context);
  return context;
}

export default createChannelContext;
