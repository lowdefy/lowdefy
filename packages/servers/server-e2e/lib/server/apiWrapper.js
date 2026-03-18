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

import path from 'path';
import { createApiContext } from '@lowdefy/api';
import { serializer } from '@lowdefy/helpers';
import { v4 as uuid } from 'uuid';

import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getE2eSecrets from './getE2eSecrets.js';
import getServerSession from './auth/getServerSession.js';
import createHandleError from './log/createHandleError.js';
import logRequest from './log/logRequest.js';
import operators from '../../build/plugins/operators/server.js';
import jsMap from '../../build/plugins/operators/serverJsMap.js';

const secrets = getE2eSecrets();

function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const context = {
      // Important to give absolute path so Next can trace build files
      rid: uuid(),
      buildDirectory: path.join(process.cwd(), 'build'),
      configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd(),
      config,
      connections,
      fileCache,
      headers: req?.headers,
      jsMap,
      handleError: async (err) => {
        console.error(err);
      },
      logger: console,
      operators,
      req,
      res,
      secrets,
    };
    try {
      context.logger = createLogger({ rid: context.rid });
      context.handleError = createHandleError({ context });
      context.session = getServerSession(context);
      createApiContext(context);
      logRequest({ context });
      // Await here so that if handler throws it is caught.
      const response = await handler({ context, req, res });
      return response;
    } catch (error) {
      await context.handleError(error);
      const serialized = serializer.serialize(error);
      if (serialized?.['~e']) {
        delete serialized['~e'].received;
        delete serialized['~e'].stack;
        delete serialized['~e'].configKey;
      }
      res.status(500).json(serialized);
    }
  };
}

export default apiWrapper;
