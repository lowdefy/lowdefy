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

import { spawnProcess } from '@lowdefy/node-utils';

async function runLowdefyBuild({ context }) {
  context.print.log('Running Lowdefy build.');
  try {
    await spawnProcess({
      logger: context.print,
      command: context.packageManager, // npm or yarn
      args: ['run', 'build:lowdefy'],
      processOptions: {
        cwd: context.directories.server,
        env: {
          ...process.env,
          LOWDEFY_BUILD_DIRECTORY: context.directories.build,
          LOWDEFY_CONFIG_DIRECTORY: context.directories.base,
          LOWDEFY_SERVER_DIRECTORY: context.directories.server,
        },
      },
      silent: false,
    });
  } catch (error) {
    throw new Error('Lowdefy build failed.');
  }
  context.print.log('Lowdefy build successful.');
}

export default runLowdefyBuild;
