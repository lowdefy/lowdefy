/*
  Copyright 2020-2024 Lowdefy, Inc

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
import path from 'path';
import crypto from 'crypto';
import { createApiContext } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import config from '../../build/config.json';
import connections from '../../build/plugins/connections.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getServerSession from './auth/getServerSession.js';
import logError from './log/logError.js';
import logRequest from './log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';
import jsMap from '../../build/plugins/operators/serverJsMap.js';
import getAuthOptions from './auth/getAuthOptions.js';

const secrets = getSecretsFromEnv();

function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const context = {
      // Important to give absolute path so Next can trace build files
      rid: crypto.randomUUID(),
      buildDirectory: path.join(process.cwd(), 'build'),
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
      }
      createApiContext(context);
      logRequest({ context });
      // Await here so that if handler throws it is caught.
      const response = await handler({ context, req, res });
      // TODO: Log response time?
      return response;
    } catch (error) {
      logError({ error, context });
      res.status(500).json({ name: error.name, message: error.message });
    }
  };
}

export default apiWrapper;
