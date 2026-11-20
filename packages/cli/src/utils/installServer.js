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

import installWorkspacePlugins from './installWorkspacePlugins.js';

// skipIfInstalled skips an install the last one already satisfies, for callers
// that reset package.json before each build of the same server folder.
async function installServer({ context, directory, skipIfInstalled = false }) {
  // Callers that skip a satisfied install (lowdefy build, lowdefy emails) run
  // in CI and Vercel builds, which restore the server's node_modules from a
  // cache: the skip passes, but the checkout is fresh and the workspace plugins
  // have no build output. So for them the plugins install whether or not the
  // server does. Other callers (lowdefy dev, lowdefy test) install the plugins
  // only with the server, so starting them runs no install when nothing changed.
  if (skipIfInstalled) {
    await installWorkspacePlugins({ context, directory });
  }
  const installed = await installIfPackageJsonChanged({
    directory,
    skipIfInstalled,
    install: async () => {
      // Installs only the plugins this process has not installed yet.
      await installWorkspacePlugins({ context, directory });
      context.logger.info({ spin: 'start' }, 'Installing dependencies.');
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
        context.logger.info({ spin: 'fail' }, 'Installing dependencies.');
        throw new Error('Dependency installation failed.', { cause: error });
      }
      context.logger.info('Dependencies install successfully.');
    },
  });
  if (!installed) {
    context.logger.info('Dependencies unchanged.');
  }
}

export default installServer;
