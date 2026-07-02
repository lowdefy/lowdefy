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

import { getBetterAuth } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import adapters from '../../../build/plugins/auth/adapters.js';
import appMeta from '../../build/appMeta.js';
import authJson from '../../build/auth.js';
import lowdefyConfig from '../../build/config.js';
import providers from '../../../build/plugins/auth/providers.js';

// Returns the BetterAuth instance (memoized in @lowdefy/api), or null when
// auth is not configured - it handles /api/auth/* and resolves the session
// for every request.
function getAuth({ logger }) {
  if (authJson.configured !== true) {
    return null;
  }
  return getBetterAuth({
    appMeta,
    authJson,
    config: lowdefyConfig,
    logger,
    plugins: { adapters, providers },
    secrets: getSecretsFromEnv(),
  });
}

export default getAuth;
