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

function createStdOutLineHandler({ context }) {
  function stdOutLineHandler(line) {
    // Matches next build output of form: ┌ λ /           261 B        403 kB
    const match = line.match(/┌ λ \/\s*\d* [a-zA-Z]*\s*(\d* [a-zA-Z]*)/u);
    if (match) {
      context.print.info(`Home page first load JS size: ${match[1]}.`);
    }
    context.print.debug(line);
  }
  return stdOutLineHandler;
}

async function runNextBuild({ context, directory }) {
  context.print.spin('Running Next build.');
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['run', 'build:next'],
      stdOutLineHandler: createStdOutLineHandler({ context }),
      processOptions: {
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
        cwd: directory,
      },
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: context.options.disableTelemetry ? '1' : undefined,
      },
    });
  } catch (error) {
    throw new Error('Next build failed.');
  }
  context.print.log('Next build successful.');
}

export default runNextBuild;
