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

import config from '../../../../../build/config.json';
import connections from '../../../../../build/plugins/connections.js';
import createLogger from '../../../../../lib/server/log/createLogger.js';
import fileCache from '../../../../../lib/server/fileCache.js';
import logError from '../../../../../lib/server/log/logError.js';
import logRequest from '../../../../../lib/server/log/logRequest.js';
import operators from '../../../../../build/plugins/operators/server.js';
import jsMap from '../../../../../build/plugins/operators/serverJsMap.js';
import getAuthOptions from '../../../../../lib/server/auth/getAuthOptions.js';

const secrets = getSecretsFromEnv();

async function createContext() {
  const context = {
    rid: crypto.randomUUID(),
    buildDirectory: path.join(process.cwd(), 'build'),
    config,
    connections,
    fileCache,
    jsMap,
    logger: console,
    operators,
    secrets,
  };

  try {
    context.logger = createLogger({ rid: context.rid });
    context.authOptions = getAuthOptions(context);

    createApiContext(context);
    logRequest({ context });
  } catch (error) {
    logError({ error, context });
  }

  return context;
}

export default createContext;
