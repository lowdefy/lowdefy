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

// Runs the server package's check:lowdefy script. The child writes
// build/checkReport.json and exits 0 whenever the check itself ran, so a
// non-zero exit here means the check broke, not that the config has errors.
async function runLowdefyCheck({ context, directory }) {
  context.logger.info({ spin: 'start' }, 'Running Lowdefy check.');
  // The CLI renders the report itself, so the child's per-error log lines would
  // only duplicate it. Debug level keeps them for troubleshooting the check.
  const logLevel = context.options.logLevel === 'debug' ? 'debug' : 'silent';
  try {
    await spawnProcess({
      args: ['run', 'check:lowdefy'],
      command: context.pnpmCmd,
      stdOutLineHandler: createStdOutLineHandler({ context }),
      processOptions: {
        cwd: directory,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          LOWDEFY_BUILD_REF_RESOLVER: context.options.refResolver,
          LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
          LOWDEFY_LOG_LEVEL: logLevel,
        },
      },
    });
  } catch (error) {
    context.logger.info({ spin: 'fail' }, 'Running Lowdefy check.');
    throw new Error('Lowdefy check failed to run.', { cause: error });
  }
  context.logger.info({ spin: 'succeed' }, 'Lowdefy check complete.');
}

export default runLowdefyCheck;
