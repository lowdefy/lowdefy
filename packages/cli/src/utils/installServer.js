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

async function installServer({ context, directory }) {
  // Skip dependency installation for local development (monorepo already has deps installed)
  if (context.lowdefyVersion === 'local') {
    context.logger.info('Skipping dependency installation for local development.');
    return;
  }
  context.logger.info({ spin: true }, 'Installing dependencies.');
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['install', '--no-frozen-lockfile'],
      stdOutLineHandler: (line) => context.logger.debug(line),
      processOptions: {
        cwd: directory,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error('Dependency installation failed.');
  }
  context.logger.info('Dependencies install successfully.');
}

export default installServer;
