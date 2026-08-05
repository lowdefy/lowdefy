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

import { getAuthStrategies, resolveStrategyCaller } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import appMeta from '../../build/appMeta.js';
import authJson from '../../build/auth.js';
import strategies from '../../../build/plugins/auth/strategies.js';

// API auth strategies (apiKey/jwt headers) let MCP and service clients that
// cannot hold a session cookie authenticate. Tried only when no session
// resolved; a match is synthesized as session.user so createAuthorize and
// _user work unchanged.
async function getStrategyCaller(c, logger) {
  const authStrategies = getAuthStrategies({
    appMeta,
    authJson,
    logger,
    plugins: { strategies },
    secrets: getSecretsFromEnv(),
  });
  return resolveStrategyCaller({
    headers: c.req.raw.headers,
    logger,
    strategies: authStrategies,
  });
}

export default getStrategyCaller;
