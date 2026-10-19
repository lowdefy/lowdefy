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

import { getAuthStrategies } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import appMeta from '../../build/appMeta.js';
import authJson from '../../build/auth.js';
import strategyTypes from '../../../build/plugins/auth/strategies.js';

// Returns the API auth strategy verifiers (memoized in @lowdefy/api), or an
// empty list when auth is not configured - resolveAuthentication tries them
// in config order when no session resolves.
function getStrategies({ logger }) {
  if (authJson.configured !== true) {
    return [];
  }
  return getAuthStrategies({
    appMeta,
    authJson,
    logger,
    plugins: { strategies: strategyTypes },
    secrets: getSecretsFromEnv(),
  });
}

export default getStrategies;
