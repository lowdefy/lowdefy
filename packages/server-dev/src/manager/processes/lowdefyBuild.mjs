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

function lowdefyBuild({ packageManager, directories }) {
  return async () => {
    await spawnProcess({
      logger: console,
      args: ['run', 'build:lowdefy'],
      command: packageManager,
      processOptions: {
        env: {
          ...process.env,
          LOWDEFY_DIRECTORY_BUILD: directories.build,
          LOWDEFY_DIRECTORY_CONFIG: directories.config,
          LOWDEFY_DIRECTORY_SERVER: process.cwd(),
        },
      },
      silent: false,
    });
  };
}

export default lowdefyBuild;
