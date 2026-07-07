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

function createStdOutLineHandler({ context }) {
  function stdOutLineHandler(line) {
    // Matches vite build output of form: dist/client/assets/main-XXXX.js  5,205.62 kB │ gzip: 1,544.04 kB
    // (the mobile client's entry chunk is index-XXXX.js).
    const match = line.match(/assets\/(?:main|index)-[\w-]+\.js\s+[\d,.]+ kB │ gzip:\s+([\d,.]+ kB)/u);
    if (match) {
      context.logger.info(`Client bundle size (gzip): ${match[1]}.`);
    }
    context.logger.debug(line);
  }
  return stdOutLineHandler;
}

// env additions spread last; name labels the log lines (e.g. 'mobile client').
async function runClientBuild({ context, directory, env = {}, name = 'client' }) {
  context.logger.info({ spin: 'start' }, `Running ${name} build.`);
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['run', 'build:client'],
      stdOutLineHandler: createStdOutLineHandler({ context }),
      processOptions: {
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
        cwd: directory,
        env: { ...process.env, ...env },
      },
    });
  } catch (error) {
    context.logger.info({ spin: 'fail' }, `Running ${name} build.`);
    throw new Error(`${name.charAt(0).toUpperCase()}${name.slice(1)} build failed.`);
  }
  context.logger.info(`${name.charAt(0).toUpperCase()}${name.slice(1)} build successful.`);
}

export default runClientBuild;
