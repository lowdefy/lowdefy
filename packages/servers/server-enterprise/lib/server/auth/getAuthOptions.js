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

import { getNextAuthConfig } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import adapters from '../../../build/plugins/auth/adapters.js';
import authJson from '../../../build/auth.json';
import callbacks from '../../../build/plugins/auth/callbacks.js';
import events from '../../../build/plugins/auth/events.js';
import providers from '../../../build/plugins/auth/providers.js';

function getAuthOptions({ logger }) {
  return getNextAuthConfig({
    authJson,
    logger,
    plugins: { adapters, callbacks, events, providers },
    secrets: getSecretsFromEnv(),
  });
}

export default getAuthOptions;
