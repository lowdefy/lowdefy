/*
  Copyright 2020-2023 Lowdefy, Inc

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
import logRequest from './log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';
import getAuthOptions from './auth/getAuthOptions.js';

function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    let logger = console;
    try {
      const rid = crypto.randomUUID();
      logger = createLogger({ rid });
      const authOptions = getAuthOptions({ logger });
      const session = await getServerSession({ authOptions, req, res });
      // Important to give absolute path so Next can trace build files
      const context = createApiContext({
        authOptions,
        buildDirectory: path.join(process.cwd(), 'build'),
        config,
        connections,
        fileCache,
        headers: req.headers,
        logger,
        operators,
        secrets: getSecretsFromEnv(),
        session,
        req,
      });
      logRequest({ context });
      // Await here so that if handler throws it is caught.
      const response = await handler({ context, req, res });
      // TODO: Log response time?
      return response;
    } catch (error) {
      // TODO: Improve (logError function)
      // TODO: Log cause
      logger.error(error);
      // TODO: What we do here?
      res.status(500).json({ name: error.name, message: error.message });
    }
  };
}

export default apiWrapper;
