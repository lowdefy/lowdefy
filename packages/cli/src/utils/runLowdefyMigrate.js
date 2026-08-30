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

// Spawns the server package's migrate:lowdefy script the way build spawns
// build:lowdefy — inside the server directory, where the connection plugins
// and the database driver are installed. scriptArgs (--dry-run, --to, …) are
// forwarded to the script after the pnpm run separator. spawnProcess rejects on
// a non-zero exit, so a failed migration surfaces as a thrown error the command
// turns into a non-zero CLI exit code.
async function runLowdefyMigrate({ context, directory, scriptArgs = [] }) {
  context.logger.info({ spin: 'start' }, 'Running Lowdefy migrations.');
  try {
    await spawnProcess({
      args: ['run', 'migrate:lowdefy', ...scriptArgs],
      command: context.pnpmCmd,
      stdOutLineHandler: createStdOutLineHandler({ context }),
      processOptions: {
        cwd: directory,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
          LOWDEFY_LOG_LEVEL: context.options.logLevel,
        },
      },
    });
  } catch (error) {
    context.logger.info({ spin: 'fail' }, 'Running Lowdefy migrations.');
    throw new Error('Lowdefy migrate failed.', { cause: error });
  }
  context.logger.info({ spin: 'succeed' }, 'Lowdefy migrations complete.');
}

export default runLowdefyMigrate;
