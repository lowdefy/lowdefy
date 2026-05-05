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
import { createAuditLogger, createReadConfigFile, getNextAuthConfig } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import adapters from '../../../build/plugins/auth/adapters.js';
import authJson from '../../build/auth.js';
import callbacks from '../../../build/plugins/auth/callbacks.js';
import connections from '../../../build/plugins/connections.js';
import events from '../../../build/plugins/auth/events.js';
import fileCache from '../fileCache.js';
import jsMap from '../../../build/plugins/operators/serverJsMap.js';
import loggerConfig from '../../build/logger.js';
import operators from '../../../build/plugins/operators/server.js';
import providers from '../../../build/plugins/auth/providers.js';

function getAuthOptions({ logger }) {
  const secrets = getSecretsFromEnv();
  const buildDirectory = path.join(process.cwd(), 'build');
  const readConfigFile = createReadConfigFile({ buildDirectory, fileCache });
  const auditContext = {
    connections,
    operators,
    jsMap,
    secrets,
    logger,
    readConfigFile,
    headers: {},
    user: {},
  };
  const audit = createAuditLogger({ auditConfig: loggerConfig.audit, context: auditContext });

  return getNextAuthConfig({
    audit,
    authJson,
    logger,
    plugins: { adapters, callbacks, events, providers },
    secrets,
  });
}

export default getAuthOptions;
