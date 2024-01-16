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

import config from '../../build/config.json';
import createLogger from './log/createLogger.js';
import fileCache from './fileCache.js';
import logError from './log/logError.js';
import logRequest from './log/logRequest.js';

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
