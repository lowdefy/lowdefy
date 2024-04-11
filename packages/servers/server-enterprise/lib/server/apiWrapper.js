/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
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
      return response;
    } catch (error) {
      logError({ error, context });
      res.status(500).json({ name: error.name, message: error.message });
    }
  };
}

export default apiWrapper;
