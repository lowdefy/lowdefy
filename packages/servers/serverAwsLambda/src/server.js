/*
  Copyright 2020-2021 Lowdefy, Inc

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

import serverless from 'serverless-http';
import getServer from '@lowdefy/server';
import shellLocation from '@lowdefy/shell';
import { createGetSecretsFromEnv } from '@lowdefy/node-utils';

const configurationBasePath = process.env.LOWDEFY_SERVER_CONFIGURATION_PATH || './build';

const server = getServer({
  configurationBasePath,
  development: false,
  getSecrets: createGetSecretsFromEnv(),
  logger: console,
  shellLocation,
});

export const handler = serverless(server, {
  binary: ['image/png'],
});
