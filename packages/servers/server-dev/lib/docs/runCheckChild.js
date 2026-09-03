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

import { check } from '@lowdefy/build/dev';
import { createNodeLogger } from '@lowdefy/logger/node';

import createCustomPluginMessagesMap from '../../manager/utils/createCustomPluginMessagesMap.mjs';
import createCustomPluginTypesMap from '../../manager/utils/createCustomPluginTypesMap.mjs';

// Child process for runCheck.js: prints the { errors, warnings } report as the
// last line of stdout and exits 0 whenever the check ran. The logger is silent
// because every error and warning is in the report already.
async function run() {
  const serverDirectory = path.resolve(process.env.LOWDEFY_DIRECTORY_SERVER ?? process.cwd());
  const directories = {
    build: path.join(serverDirectory, 'build'),
    config: path.resolve(process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd()),
    server: serverDirectory,
  };
  const logger = createNodeLogger({ name: 'lowdefy_check', level: 'silent' });
  const customTypesMap = await createCustomPluginTypesMap({ directories, logger });
  const customMessagesMap = await createCustomPluginMessagesMap({ directories, logger });
  const report = await check({
    customMessagesMap,
    customTypesMap,
    directories,
    logger,
    refResolver: process.env.LOWDEFY_BUILD_REF_RESOLVER,
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

run();
