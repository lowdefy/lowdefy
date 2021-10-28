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

import dotenv from 'dotenv';
import pino from 'pino';

import {
  clientDirectory,
  // publicDirectory as defaultPublicDirectory
} from '@lowdefy/client';
import { getConfigFromEnv, getSecretsFromEnv } from '@lowdefy/node-utils';

import AxiosHttp from '@lowdefy/connection-axios-http';

function config() {
  dotenv.config({ silent: true });

  const logger = pino({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
    },
  });

  const { buildDirectory, publicDirectory, port, serverBasePath } = getConfigFromEnv();

  // TODO: dynamic connections
  const connections = {
    AxiosHttp,
  };

  return {
    clientDirectory,
    buildDirectory: buildDirectory || './.lowdefy/build',
    connections,
    development: true,
    logger,
    port: port || 3000,
    publicDirectory: publicDirectory || '../../shell/src/public',
    // publicDirectory: publicDirectory || defaultPublicDirectory,
    secrets: getSecretsFromEnv(),
    serverBasePath,
  };
}

export default config;
