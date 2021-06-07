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
import getServer from '@lowdefy/server';
import { publicDirectory as defaultPublicDirectory, shellDirectory } from '@lowdefy/shell';
import { createGetSecretsFromEnv } from '@lowdefy/node-utils';

dotenv.config({ silent: true });

const buildDirectory = process.env.LOWDEFY_SERVER_BUILD_DIRECTORY || './.lowdefy/build';
const publicDirectory = process.env.LOWDEFY_SERVER_PUBLIC_DIRECTORY || defaultPublicDirectory;
const port = parseInt(process.env.LOWDEFY_SERVER_PORT) || 3000;

const server = getServer({
  buildDirectory,
  development: true,
  getSecrets: createGetSecretsFromEnv(),
  logger: console,
  publicDirectory,
  shellDirectory,
});

server.listen({ port }, () => console.log(`🚀 Server ready at http://localhost:${port}`));
