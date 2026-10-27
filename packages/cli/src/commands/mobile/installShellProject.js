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

import { installIfPackageJsonChanged, spawnProcess } from '@lowdefy/node-utils';

const INSTALL_ARGS = ['install', '--no-frozen-lockfile'];

// Installs the shell project with its own lockfile, in its own folder, so
// `expo` and EAS find every native dependency where they look for it.
async function installShellProject({ context, directory, dryRun }) {
  if (dryRun) {
    context.logger.info(`[dry run] ${context.pnpmCmd} ${INSTALL_ARGS.join(' ')}`);
    context.logger.info(`[dry run]   cwd: ${directory}`);
    return;
  }
  const installed = await installIfPackageJsonChanged({
    directory,
    install: async () => {
      context.logger.info({ spin: 'start' }, 'Installing the shell project.');
      try {
        await spawnProcess({
          command: context.pnpmCmd,
          args: INSTALL_ARGS,
          stdOutLineHandler: (line) => context.logger.debug(line),
          processOptions: {
            cwd: directory,
            // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
            shell: process.platform === 'win32',
          },
        });
      } catch (error) {
        context.logger.info({ spin: 'fail' }, 'Installing the shell project.');
        throw new Error('Shell project installation failed.', { cause: error });
      }
      context.logger.info('Shell project installed.');
    },
  });
  if (!installed) {
    context.logger.info('Shell project dependencies unchanged.');
  }
}

export default installShellProject;
