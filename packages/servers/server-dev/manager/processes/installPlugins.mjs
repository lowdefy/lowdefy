/*
  Copyright 2020-2024 Lowdefy, Inc

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

function installPlugins({ logger, packageManagerCmd }) {
  return async () => {
    logger.info({ print: 'spin' }, 'Installing plugins...');
    await spawnProcess({
      processOptions: {
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
      },
      command: packageManagerCmd,
      args: ['install', '--no-frozen-lockfile'],
      stdOutLineHandler: (line) => logger.debug(line),
    });
    logger.info({ print: 'log' }, 'Installed plugins.');
  };
}

export default installPlugins;
