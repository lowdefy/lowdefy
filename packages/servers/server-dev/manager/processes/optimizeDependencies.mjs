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

import createServerEnv from '../utils/createServerEnv.mjs';

// Runs Vite's dependency optimiser in a short-lived process before the Vite
// child starts, so the long-lived child starts against a warm
// node_modules/.vite/deps cache and never optimises itself. Rolldown keeps
// 500-600 MB of native memory after optimising, and only ending the process
// gives it back. With a valid cache this returns after resolving the config.
// Runs after a build: vite.config.js reads build/config.json when it loads.
function optimizeDependencies(context) {
  return async () => {
    const started = Date.now();
    context.logger.debug('Optimizing dependencies...');
    const stderr = [];
    try {
      await spawnProcess({
        command: 'node',
        args: [context.bin.vite, 'optimize'],
        processOptions: {
          cwd: context.directories.server,
          env: createServerEnv(context),
        },
        stdOutLineHandler: (line) => context.logger.debug(line),
        stdErrLineHandler: (line) => {
          stderr.push(String(line));
        },
      });
    } catch (error) {
      // Never stops the server from starting: the child then optimises
      // itself, as it did before this step existed.
      context.logger.warn(
        `Dependency optimization failed (${
          error.message
        }); the dev server optimizes on start instead.\n${stderr.slice(-20).join('\n')}`
      );
      return;
    }
    context.logger.debug(`Optimized dependencies in ${Date.now() - started} ms.`);
  };
}

export default optimizeDependencies;
