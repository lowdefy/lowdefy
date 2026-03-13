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

import { getSecretsFromEnv } from '@lowdefy/node-utils';

import createLogger from './log/createLogger.js';

const logger = createLogger();

function getE2eSecrets() {
  const envSecrets = getSecretsFromEnv();

  const e2eOverrides = {};
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('LOWDEFY_E2E_SECRET_')) {
      e2eOverrides[key.replace('LOWDEFY_E2E_SECRET_', '')] = process.env[key];
    }
  });

  if (Object.keys(e2eOverrides).length > 0) {
    logger.info({ overriddenKeys: Object.keys(e2eOverrides) }, 'E2E secret overrides active');
    return Object.freeze({ ...envSecrets, ...e2eOverrides });
  }

  return envSecrets;
}

export default getE2eSecrets;
