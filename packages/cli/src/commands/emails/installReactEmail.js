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

import fs from 'fs';
import path from 'path';
import { spawnProcess } from '@lowdefy/node-utils';

const reactEmailVersion = '6.6.6';

// The react-email preview CLI is a dev-only tool — the build never adds it to
// the server package, so production installs don't carry it. Install it
// just-in-time into the server directory when the emails command runs.
async function installReactEmail({ context, directory }) {
  const emailBin = path.join(
    directory,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'email.cmd' : 'email'
  );
  if (fs.existsSync(emailBin)) {
    return;
  }
  context.logger.info({ spin: 'start' }, 'Installing the react-email preview server.');
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['add', '--save-dev', `react-email@${reactEmailVersion}`],
      stdOutLineHandler: (line) => context.logger.debug(line),
      processOptions: {
        cwd: directory,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
      },
    });
  } catch (error) {
    context.logger.info({ spin: 'fail' }, 'Installing the react-email preview server.');
    throw new Error('react-email installation failed.');
  }
  context.logger.info('react-email preview server installed.');
}

export default installReactEmail;
