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

import config from '../../build/config.json';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import getServerSession from './auth/getServerSession.js';
import logError from './log/logError.js';
import logRequest from './log/logRequest.js';
import getAuthOptions from './auth/getAuthOptions.js';

// TODO: Merge serverSidePropsWrapper and apiWrapper?
function serverSidePropsWrapper(handler) {
  return async function wrappedHandler(nextContext) {
    const context = {
      // Important to give absolute path so Next can trace build files
      rid: crypto.randomUUID(),
      buildDirectory: path.join(process.cwd(), 'build'),
      config,
      fileCache,
      headers: nextContext?.req?.headers,
      logger: console,
      nextContext,
      req: nextContext?.req,
      res: nextContext?.res,
    };
    try {
      context.logger = createLogger({ rid: context.rid });
      context.authOptions = getAuthOptions(context);
      context.session = await getServerSession(context);
      createApiContext(context);
      logRequest({ context });
      // Await here so that if handler throws it is caught.
      const response = await handler({ context, nextContext });
      return response;
    } catch (error) {
      logError({ error, context });
      throw error;
    }
  };
}

export default serverSidePropsWrapper;
