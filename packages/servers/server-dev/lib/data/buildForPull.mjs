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

import fs from 'node:fs';
import path from 'node:path';
import { shallowBuild } from '@lowdefy/build/dev';

import createCustomPluginMessagesMap from '../../manager/utils/createCustomPluginMessagesMap.mjs';
import createCustomPluginTypesMap from '../../manager/utils/createCustomPluginTypesMap.mjs';

// The pull's own build, into .lowdefy/data/.build, never the running dev server's build or server
// directory (a build cleans and rewrites parts of its server directory). It runs as the `from`
// environment, which LOWDEFY_ENVIRONMENT makes win over a literal config.environment, and with
// environmentGuards: 'all', which writes every environment's guards and skips the build's own
// guard check.
async function buildForPull({ configDirectory, serverDirectory, from, logger, refResolver }) {
  const pullDirectory = path.join(configDirectory, '.lowdefy', 'data', '.build');
  const directories = {
    config: configDirectory,
    build: path.join(pullDirectory, 'build'),
    server: path.join(pullDirectory, 'server'),
  };
  // The build copies public_default into its server directory and reads package.json there;
  // none of the pull's reads need the copied files.
  await fs.promises.mkdir(path.join(directories.server, 'public_default'), { recursive: true });
  await fs.promises.copyFile(
    path.join(serverDirectory, 'package.json'),
    path.join(directories.server, 'package.json')
  );
  const [customTypesMap, customMessagesMap] = await Promise.all([
    createCustomPluginTypesMap({ directories, logger }),
    createCustomPluginMessagesMap({ directories, logger }),
  ]);
  const previousEnvironment = process.env.LOWDEFY_ENVIRONMENT;
  process.env.LOWDEFY_ENVIRONMENT = from;
  try {
    await shallowBuild({
      customMessagesMap,
      customTypesMap,
      directories,
      environmentGuards: 'all',
      logger,
      refResolver,
      stage: 'dev',
    });
  } finally {
    if (previousEnvironment === undefined) {
      delete process.env.LOWDEFY_ENVIRONMENT;
    } else {
      process.env.LOWDEFY_ENVIRONMENT = previousEnvironment;
    }
  }
  return directories.build;
}

export default buildForPull;
