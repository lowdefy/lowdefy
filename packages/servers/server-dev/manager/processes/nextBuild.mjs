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

import { BuildError } from '@lowdefy/errors';
import { spawnProcess } from '@lowdefy/node-utils';

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function nextBuild({ bin, logger }) {
  return async () => {
    logger.info({ spin: 'start' }, 'Building app...');
    const startTime = Date.now();
    const errorLines = [];
    try {
      await spawnProcess({
        command: 'node',
        args: ['--max-old-space-size=4096', bin.next, 'build'],
        stdOutLineHandler: (line) => logger.debug(line),
        stdErrLineHandler: (line) => {
          logger.debug(line);
          errorLines.push(line);
        },
      });
    } catch (err) {
      if (errorLines.length > 0) {
        errorLines.forEach((line) => logger.error(line));
      }
      throw new BuildError('Next.js build failed. See above for details.');
    }
    logger.info({ spin: 'succeed' }, `Built app in ${formatDuration(Date.now() - startTime)}.`);
  };
}

export default nextBuild;
