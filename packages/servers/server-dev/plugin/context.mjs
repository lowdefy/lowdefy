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

import createDevLogger from '../manager/utils/createDevLogger.mjs';
import checkMockUserWarning from './processes/checkMockUserWarning.mjs';
import installPlugins from './processes/installPlugins.mjs';
import lowdefyBuild from './processes/lowdefyBuild.mjs';
import readDotEnv from './processes/readDotEnv.mjs';

// The plugin runs inside the Vite process; all options arrive as environment
// variables set by the CLI (runDevServer) and forwarded by the supervisor.
function createPluginContext() {
  const env = process.env;

  const context = {
    directories: {
      build: path.resolve(process.cwd(), './build'),
      config: path.resolve(env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd()),
      server: process.cwd(),
    },
    logger: createDevLogger(),
    options: {
      port: env.PORT ?? 3000,
      refResolver: env.LOWDEFY_BUILD_REF_RESOLVER,
      watch: env.LOWDEFY_SERVER_DEV_WATCH ? JSON.parse(env.LOWDEFY_SERVER_DEV_WATCH) : [],
      watchIgnore: env.LOWDEFY_SERVER_DEV_WATCH_IGNORE
        ? JSON.parse(env.LOWDEFY_SERVER_DEV_WATCH_IGNORE)
        : [],
    },
    version: env.npm_package_version,
  };

  context.packageManagerCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  context.checkMockUserWarning = checkMockUserWarning(context);
  context.installPlugins = installPlugins(context);
  context.lowdefyBuild = lowdefyBuild(context);
  context.readDotEnv = readDotEnv(context);

  return context;
}

export default createPluginContext;
