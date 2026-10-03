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

import { createStdOutLineHandler } from '@lowdefy/logger/cli';

import spawnServer from '../../utils/spawnServer.js';
import resolveMockUser from './resolveMockUser.js';

async function runDevServer({ context, directory }) {
  const env = {
    ...process.env,
    LOWDEFY_BUILD_REF_RESOLVER: context.options.refResolver,
    LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
    LOWDEFY_LOG_LEVEL: context.options.logLevel,
    LOWDEFY_SERVER_DEV_OPEN_BROWSER: !!context.options.open,
    LOWDEFY_SERVER_DEV_STRICT_PORT: !!context.options.strictPort,
    LOWDEFY_SERVER_DEV_WATCH: JSON.stringify(context.options.watch),
    LOWDEFY_SERVER_DEV_WATCH_IGNORE: JSON.stringify(context.options.watchIgnore),
    PORT: context.options.port,
  };
  // Set only when requested — an undefined value would clobber the LOWDEFY_DEV_USER
  // inherited from process.env above.
  if (context.options.mockUser) {
    env.LOWDEFY_DEV_USER = resolveMockUser(context.options.mockUser);
  }
  // Set only when requested, so an inherited LOWDEFY_EXIT_WITH_PID passes through.
  if (context.options.exitWithPid) {
    env.LOWDEFY_EXIT_WITH_PID = String(context.options.exitWithPid);
  }
  await spawnServer({
    directory,
    entry: 'manager/run.mjs',
    env,
    stdOutLineHandler: createStdOutLineHandler({ context }),
  });
}

export default runDevServer;
