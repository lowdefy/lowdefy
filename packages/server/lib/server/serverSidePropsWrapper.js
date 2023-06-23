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

import config from '../../build/config.json';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getServerSession from './auth/getServerSession.js';
import logRequest from './log/logRequest.js';
import getAuthOptions from './auth/getAuthOptions.js';

// TODO: Merge serverSidePropsWrapper and apiWrapper?
function serverSidePropsWrapper(handler) {
  return async function wrappedHandler(nextContext) {
    let logger = console;
    try {
      const { req, res } = nextContext;
      const rid = crypto.randomUUID();
      logger = createLogger({ rid });
      const authOptions = getAuthOptions({ logger });
      const session = await getServerSession({ authOptions, req, res });
      // Important to give absolute path so Next can trace build files
      const context = createApiContext({
        authOptions,
        buildDirectory: path.join(process.cwd(), 'build'),
        config,
        fileCache,
        headers: req.headers,
        logger,
        session,
        nextContext,
        req,
      });
      logRequest({ context });
      // Await here so that if handler throws it is caught.
      const response = await handler({ context, nextContext });
      // TODO: Log response time?
      return response;
    } catch (error) {
      // TODO: Improve
      // TODO: Log cause
      logger.error(error);
      // TODO: What we do here?
      throw error;
    }
  };
}

export default serverSidePropsWrapper;