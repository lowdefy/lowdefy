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
import { createSystemContext as buildSystemContext } from '@lowdefy/api';
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
import loadDynamicJsMap from '../loadDynamicJsMap.js';
import notifications from '../../../build/plugins/notifications.js';
import operators from '../../../build/plugins/operators/server.js';
import steps from '../../../build/plugins/steps.js';
import websockets from '../../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Builds a fresh system context per auth hook fire - the trusted internal
// caller the BetterAuth engine uses to invoke hook endpoints. All fields are
// startup singletons except the per-fire rid, logger, handleError, the
// dynamic jsMap re-read (JIT rebuilds rewrite serverJsMap.js), and auth -
// auth is threaded in by the caller (createHookDispatch) rather than
// imported directly, since it comes from the same BetterAuth construction
// that this factory is a dependency of (see createHookDispatch.js).
function createSystemContext({ auth } = {}) {
  const rid = uuid();
  const buildDirectory = path.join(process.cwd(), 'build');
  return buildSystemContext({
    rid,
    agents,
    appMeta,
    auth,
    buildDirectory,
    config,
    configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd(),
    connections,
    createHandleError,
    fileCache,
    i18n: i18nConfig,
    jsMap: loadDynamicJsMap(buildDirectory),
    logger: createLogger({ rid }),
    notifications,
    operators,
    secrets,
    steps,
    websockets,
  });
}

export default createSystemContext;
