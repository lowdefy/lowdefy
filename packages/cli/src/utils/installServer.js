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
import { installIfPackageJsonChanged, spawnProcess, writeFile } from '@lowdefy/node-utils';

async function installServer({ context, directory }) {
  // Install with a hoisted (flat, real-directory) node_modules rather than pnpm's default isolated
  // layout. The isolated layout symlinks packages into a .pnpm store, and those symlinks do not
  // survive being copied into a Vercel Build Output function (`lowdefy vercel-output`) — the server
  // would fail at runtime with "Cannot find package 'hono'". A local .npmrc only sets node-linker,
  // so registry/auth settings from parent .npmrc files still apply.
  await writeFile(path.join(directory, '.npmrc'), 'node-linker=hoisted\n');

  const installed = await installIfPackageJsonChanged({
    directory,
    install: async () => {
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
        throw new Error('Dependency installation failed.');
      }
      context.logger.info('Dependencies install successfully.');
    },
  });
  if (!installed) {
    context.logger.info('Dependencies unchanged.');
  }
}

export default installServer;
