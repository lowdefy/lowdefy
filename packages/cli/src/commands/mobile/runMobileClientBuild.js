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

import { spawnProcess } from '@lowdefy/node-utils';
import { createStdOutLineHandler } from '@lowdefy/logger/cli';

async function runMobileClientBuild({ context, directory }) {
  context.logger.info({ spin: 'start' }, 'Running mobile client build.');
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['run', 'build:client'],
      stdOutLineHandler: createStdOutLineHandler({ context }),
      processOptions: {
        cwd: directory,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
        env: {
          // LOWDEFY_MOBILE_SERVER_URL passes through process.env — a per-build
          // serverUrl override for staging/production variants.
          ...process.env,
          LOWDEFY_DIRECTORY_BUILD: context.directories.build,
        },
      },
    });
  } catch (error) {
    context.logger.info({ spin: 'fail' }, 'Running mobile client build.');
    throw new Error('Mobile client build failed.');
  }
  context.logger.info('Mobile client build successful.');
}

export default runMobileClientBuild;
