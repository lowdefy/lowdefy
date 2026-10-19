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

async function runStart({ context, directory }) {
  const env = {
    ...process.env,
    LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
    LOWDEFY_LOG_LEVEL: context.options.logLevel,
    PORT: context.options.port,
  };
  // Set only when requested, so an inherited LOWDEFY_EXIT_WITH_PID (from a
  // test runner that started this CLI) passes through to the server.
  if (context.options.exitWithPid) {
    env.LOWDEFY_EXIT_WITH_PID = String(context.options.exitWithPid);
  }
  await spawnServer({
    directory,
    entry: 'src/index.js',
    env,
    stdOutLineHandler: createStdOutLineHandler({ context }),
  });
}

export default runStart;
