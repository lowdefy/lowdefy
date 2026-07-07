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

// Icon and splash generation via the @capacitor/assets convention
// (mobile/assets/logo.png, splash.png).
async function runCapacitorAssets({ context }) {
  context.logger.info({ spin: 'start' }, 'Generating icons and splash screens.');
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['exec', 'capacitor-assets', 'generate'],
      stdOutLineHandler: (line) => context.logger.debug(line),
      processOptions: {
        cwd: context.directories.mobileProject,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
      },
    });
  } catch (error) {
    context.logger.info({ spin: 'fail' }, 'Generating icons and splash screens.');
    throw new Error('Icon and splash screen generation failed.');
  }
  context.logger.info('Icons and splash screens generated.');
}

export default runCapacitorAssets;
